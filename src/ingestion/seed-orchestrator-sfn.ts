import * as path from 'path';
import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import { Aws, CustomResource, Duration } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { CfnTrigger } from 'aws-cdk-lib/aws-glue';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { JsonPath, StateMachine, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { DynamoAttributeValue, DynamoPutItem, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface SfnSeedTaskProps {
  bucket: IBucket;
  auditTable: ITable;
  table: ITable;
  crawlerName: string;
}

export class SfnSeedTask extends Construct {
  constructor(scope: Construct, id: string, props: SfnSeedTaskProps) {
    super(scope, id);

    const logStartTask = new DynamoPutItem(this, 'Log Run Start', {
      item: {
        PK: DynamoAttributeValue.fromString(JsonPath.stringAt('$.taskId')),
        SK: DynamoAttributeValue.fromString(JsonPath.stringAt(`States.Format('{}', ${'$.timestamp'})`)),
        Status: DynamoAttributeValue.fromString('TASK RUN START'),
      },
      table: props.auditTable,
      resultPath: JsonPath.DISCARD,
    });

    const logSeedSuccessTask = new DynamoPutItem(this, 'Log Seed Success', {
      item: {
        PK: DynamoAttributeValue.fromString(JsonPath.stringAt('$.taskId')),
        SK: DynamoAttributeValue.fromString(Math.floor(new Date().getTime() / 1000).toString()),
        Status: DynamoAttributeValue.fromString('DYNAMO SEED SUCCESS'),
      },
      table: props.auditTable,
      resultPath: JsonPath.DISCARD,
    });

    const logCrawlSuccessTask = new DynamoPutItem(this, 'Log Crawl Success', {
      item: {
        PK: DynamoAttributeValue.fromString(JsonPath.stringAt('$.taskId')),
        SK: DynamoAttributeValue.fromString(Math.floor(new Date().getTime() / 1000).toString()),
        Status: DynamoAttributeValue.fromString('CRAWL SUCCESS'),
      },
      table: props.auditTable,
      resultPath: JsonPath.DISCARD,
    });

    const logEndTask = new DynamoPutItem(this, 'Log Run Success', {
      item: {
        PK: DynamoAttributeValue.fromString(JsonPath.stringAt('$.taskId')),
        SK: DynamoAttributeValue.fromString(Math.floor(new Date().getTime() / 1000).toString()),
        Status: DynamoAttributeValue.fromString('TASK RUN SUCCESS'),
      },
      table: props.auditTable,
      resultPath: JsonPath.DISCARD,
    });

    // Functions
    const ddbSeeder = new GoFunction(this, 'ddb-seeder', {
      entry: path.resolve(__dirname, '../lambdas/cmd/dynamodb-seeder'),
      environment: {
        S3_BUCKET: props.bucket.bucketName,
        DDB_TABLE: props.table.tableName,
      },
      timeout: Duration.minutes(5),
    });

    const crawlerTrigger = new CfnTrigger(this, 'glueTriggerExchanges', {
      type: 'ON_DEMAND',
      actions: [
        {
          crawlerName: props.crawlerName,
        },
      ],
      description: 'Start the Glue Crawler',
    });

    const crawlerStarter = new GoFunction(this, 'CrawlerStarter', {
      entry: path.resolve(__dirname, '../lambdas/cmd/crawler-starter'),
      environment: {
        GLUE_TRIGGER_NAME: crawlerTrigger.ref,
      },
      timeout: Duration.minutes(5),
    });

    const ddbSeederTask = new LambdaInvoke(this, 'seed-ddb', {
      lambdaFunction: ddbSeeder,
      resultPath: JsonPath.DISCARD,
      timeout: Duration.minutes(5),
    });

    const crawlerStarterTask = new LambdaInvoke(this, 'crawler-starter', {
      lambdaFunction: crawlerStarter,
      resultPath: JsonPath.DISCARD,
      timeout: Duration.minutes(5),
    });

    const definition = logStartTask
      .next(ddbSeederTask)
      .next(logSeedSuccessTask)
      .next(
        new Wait(this, 'Wait 5 minutes for seeder', {
          time: WaitTime.duration(Duration.minutes(5)),
        }),
      )
      .next(crawlerStarterTask)
      .next(
        new Wait(this, 'Wait 5 minutes for crawler', {
          time: WaitTime.duration(Duration.minutes(5)),
        }),
      )
      .next(logCrawlSuccessTask)
      .next(logEndTask);
    const stateMachine = new StateMachine(this, 'StateMachine', {
      definition,
    });

    const invokeStepFunction = new GoFunction(this, 'invoke-sfn', {
      entry: path.resolve(__dirname, '../lambdas/cmd/sfn-invoker'),
      environment: {
        StateMachineArn: stateMachine.stateMachineArn,
      },
    });

    crawlerStarter.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['glue:StartTrigger'],
        resources: [`arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:trigger/${crawlerTrigger.ref}`],
      }),
    );

    props.bucket.grantRead(ddbSeeder);
    props.table.grantWriteData(ddbSeeder);
    props.auditTable.grantWriteData(stateMachine);
    stateMachine.grantStartExecution(invokeStepFunction);

    const sfnStarterProvider = new Provider(this, 'CrawlerStarterProvider', {
      onEventHandler: invokeStepFunction,
    });

    new CustomResource(this, 'CrawlerStarterCustomResource', {
      serviceToken: sfnStarterProvider.serviceToken,
      resourceType: 'Custom::SfnStarter',
      properties: {
        taskId: 'seed-dynamo',
      },
    });
  }
}
