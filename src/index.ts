import * as path from 'path';
import { Database, DataFormat, Schema, Table as gTable } from '@aws-cdk/aws-glue-alpha';
import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import { Aws, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { CfnWorkGroup } from 'aws-cdk-lib/aws-athena';
import { AttributeType, BillingMode, ITable, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { ArnPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IStream, Stream, StreamEncryption, StreamMode } from 'aws-cdk-lib/aws-kinesis';
import { CfnDeliveryStream } from 'aws-cdk-lib/aws-kinesisfirehose';
import { LogGroup, LogStream, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { BlockPublicAccess, Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class DynamoAthenaSeeder extends Construct {
  public readonly seedBucket: IBucket;
  public readonly stream: IStream;
  public readonly table: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const streamLogGroup = new LogGroup(this, 'deliveryLogGroup', {
      retention: RetentionDays.ONE_WEEK,
      logGroupName: '/aws/kinesisfirehose/ddb-athena',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new LogStream(this, 'deliveryLogStream', {
      logGroup: streamLogGroup,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const landingBucket = new Bucket(this, 'Bucket', {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    const stream = new Stream(this, 'stream', {
      streamName: `ddb-athena-stream`,
      encryption: StreamEncryption.MANAGED,
      streamMode: StreamMode.ON_DEMAND,
    });

    const table = new Table(this, 'analytics-table', {
      tableName: 'ddb-athena',
      partitionKey: {
        name: 'PK',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: TableEncryption.AWS_MANAGED,
      billingMode: BillingMode.PAY_PER_REQUEST,
      kinesisStream: stream,
    });

    const glueDatabase = new Database(this, 'GlueDB', {
      databaseName: 'ddb_athena',
    });

    const glueTable = new gTable(this, 'GlueTable', {
      database: glueDatabase,
      tableName: 'seeder',
      columns: [
        {
          name: 'PK',
          type: Schema.TIMESTAMP,
        },
        {
          name: 'SK',
          type: Schema.STRING,
        },
      ],
      storedAsSubDirectories: true,
      dataFormat: DataFormat.PARQUET,
      s3Prefix: 'data/',
      partitionKeys: [
        {
          name: 'year',
          type: Schema.STRING,
        },
        {
          name: 'month',
          type: Schema.STRING,
        },
        {
          name: 'day',
          type: Schema.STRING,
        },
      ],
      bucket: landingBucket,
    });

    const kinesisLambda = new GoFunction(this, 'handler', {
      entry: path.resolve(__dirname, './lambda/firehose-enricher'),
      logRetention: RetentionDays.THREE_DAYS,
    });

    const ingestionRole = new Role(this, 'IngestionRole', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        AllowFirehose: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['kinesis:DescribeStream', 'kinesis:GetRecords', 'kinesis:GetShardIterator'],
              effect: Effect.ALLOW,
              resources: [stream.streamArn],
            }),

            new PolicyStatement({
              actions: ['glue:GetTableVersions'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    landingBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ['s3:*'],
        resources: [landingBucket.bucketArn, landingBucket.arnForObjects('*')],
        principals: [new ArnPrincipal(ingestionRole.roleArn)],
      }),
    );

    stream.grantReadWrite(ingestionRole);
    streamLogGroup.grantWrite(ingestionRole);
    landingBucket.grantWrite(ingestionRole);
    kinesisLambda.grantInvoke(ingestionRole);

    new CfnDeliveryStream(this, 'DeliveryStream', {
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: stream.streamArn,
        roleArn: ingestionRole.roleArn,
      },
      extendedS3DestinationConfiguration: {
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: '/aws/kinesisfirehose/test-stream',
          logStreamName: 'S3Delivery',
        },
        bucketArn: landingBucket.bucketArn,
        compressionFormat: 'UNCOMPRESSED',
        errorOutputPrefix: `error/!{firehose:error-output-type}/dt=!{timestamp:yyyy'-'MM'-'dd}/h=!{timestamp:HH}/`,
        prefix:
          'data/year=!{partitionKeyFromLambda:year}/month=!{partitionKeyFromLambda:month}/day=!{partitionKeyFromLambda:day}/',
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: 'Lambda',
              parameters: [
                {
                  parameterName: 'LambdaArn',
                  parameterValue: kinesisLambda.functionArn,
                },
              ],
            },
            {
              type: 'AppendDelimiterToRecord',
              parameters: [
                {
                  parameterName: 'Delimiter',
                  parameterValue: '\\n',
                },
              ],
            },
          ],
        },
        dynamicPartitioningConfiguration: {
          enabled: true,
        },
        bufferingHints: {
          intervalInSeconds: 60,
        },
        roleArn: ingestionRole.roleArn,
        dataFormatConversionConfiguration: {
          schemaConfiguration: {
            roleArn: ingestionRole.roleArn,
            catalogId: Aws.ACCOUNT_ID,
            databaseName: glueDatabase.databaseName,
            tableName: glueTable.tableName,
            region: Aws.REGION,
          },
          inputFormatConfiguration: {
            deserializer: {
              openXJsonSerDe: {},
            },
          },
          outputFormatConfiguration: {
            serializer: {
              parquetSerDe: {},
            },
          },
          enabled: true,
        },
      },
    });

    // Athena Workgroup
    new CfnWorkGroup(this, 'AthenaWorkgroup', {
      name: Aws.STACK_NAME,
      recursiveDeleteOption: true,
      state: 'ENABLED',
      workGroupConfiguration: {
        enforceWorkGroupConfiguration: true,
        resultConfiguration: {
          outputLocation: `s3://${landingBucket.bucketName}/results`,
        },
      },
    });

    new CfnOutput(this, 's3-landing-bucket-output', {
      description: 'Seed s3 bucket name',
      value: landingBucket.bucketName,
    });
    new CfnOutput(this, 'table-output', {
      description: 'Dynamodb table name',
      value: table.tableName,
    });

    this.seedBucket = landingBucket;
    this.stream = stream;
    this.table = table;
  }
}
