import * as path from 'path';
import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { JsonPath, StateMachine, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import {
  DynamoAttributeValue,
  DynamoPutItem,
  DynamoUpdateItem,
  LambdaInvoke,
} from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface SfnSeedTaskProps {
  bucket: IBucket;
  table: ITable;
}

export class SfnSeedTask extends Construct {
  public readonly table: ITable;

  constructor(scope: Construct, id: string, props: SfnSeedTaskProps) {
    super(scope, id);

    const auditTable = new Table(this, 'audit-table', {
      partitionKey: {
        name: 'taskId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: AttributeType.NUMBER,
      },
      tableName: 'Tasks',
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const logStartTask = new DynamoPutItem(this, 'create-ddb-item', {
      item: {
        taskId: DynamoAttributeValue.fromString(JsonPath.stringAt('$.taskId')),
        timestamp: DynamoAttributeValue.numberFromString(JsonPath.stringAt(`States.Format('{}', ${'$.timestamp'})`)),
        Status: DynamoAttributeValue.fromString('STARTED'),
      },
      table: auditTable,
      resultPath: JsonPath.DISCARD,
    });

    const waitX = new Wait(this, 'Execute long running task...wait 30 seconds', {
      time: WaitTime.duration(Duration.seconds(30)),
    });

    const logEndTask = new DynamoUpdateItem(this, 'UpdateDynamoTaskItem', {
      key: {
        taskId: DynamoAttributeValue.fromString(JsonPath.stringAt('$.taskId')),
        timestamp: DynamoAttributeValue.numberFromString(JsonPath.stringAt(`States.Format('{}', ${'$.timestamp'})`)),
      },
      table: auditTable,
      expressionAttributeValues: {
        ':val': DynamoAttributeValue.fromString('Done'),
      },
      expressionAttributeNames: {
        '#s': 'Status',
      },
      updateExpression: 'SET #s = :val',
    });

    const ddbSeeder = new GoFunction(this, 'ddb-seeder', {
      entry: path.resolve(__dirname, '../lambdas/cmd/dynamodb-seeder'),
      environment: {
        S3_BUCKET: props.bucket.bucketName,
        DDB_TABLE: props.table.tableName,
      },
      timeout: Duration.minutes(5),
    });

    const ddbSeederTask = new LambdaInvoke(this, 'seed-ddb', {
      lambdaFunction: ddbSeeder,
      timeout: Duration.minutes(5),
    });

    const definition = logStartTask.next(ddbSeederTask).next(waitX).next(logEndTask);
    const stateMachine = new StateMachine(this, 'StateMachine', {
      definition,
    });

    const invokeStepFunction = new GoFunction(this, 'invoke-sfn', {
      entry: path.resolve(__dirname, '../lambdas/cmd/sfn-invoker'),
      environment: {
        StateMachineArn: stateMachine.stateMachineArn,
      },
    });

    // const crawlerTrigger = new CfnTrigger(this, 'glueTriggerExchanges', {
    //   name: 'seed-crawler-trigger',
    //   type: 'ON_DEMAND',
    //   actions: [
    //     {
    //       crawlerName: 'seed-crawler',
    //     },
    //   ],
    //   description: 'Start the Glue Crawler',
    // });
    //
    // const crawlerStarter = new GoFunction(this, 'CrawlerStarter', {
    //   entry: path.resolve(__dirname, '../lambdas/cmd/crawler-starter'),
    // });
    // crawlerStarter.addToRolePolicy(
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ['glue:StartTrigger'],
    //     resources: [`arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:trigger/${crawlerTrigger.name}`],
    //   }),
    // );
    //
    // const crawlerStatusCheckerTimeout = Duration.minutes(5);
    // const crawlerStatusChecker = new GoFunction(this, 'CrawlerStatusChecker', {
    //   entry: path.resolve(__dirname, '../lambdas/cmd/crawler-status-checker'),
    //   timeout: crawlerStatusCheckerTimeout,
    // });
    // crawlerStatusChecker.addToRolePolicy(
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ['glue:GetCrawler'],
    //     resources: [`arn:${Aws.PARTITION}:glue:${Aws.REGION}:${Aws.ACCOUNT_ID}:crawler/seed-crawler`],
    //   }),
    // );

    props.bucket.grantRead(ddbSeeder);
    props.table.grantWriteData(ddbSeeder);
    auditTable.grantWriteData(stateMachine);
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

    this.table = auditTable;
  }
}