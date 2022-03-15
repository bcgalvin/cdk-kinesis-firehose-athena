import {
  Database,
  InputFormat,
  OutputFormat,
  Schema,
  SerializationLibrary,
  Table as gTable,
} from '@aws-cdk/aws-glue-alpha';
import { Aws, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
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
      logGroupName: '/aws/kinesisfirehose/test-stream',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new LogStream(this, 'deliveryLogStream', {
      logGroup: streamLogGroup,
      logStreamName: 'S3Delivery',
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
      streamName: `ddb-kinesis-stream`,
      encryption: StreamEncryption.MANAGED,
      streamMode: StreamMode.ON_DEMAND,
    });

    const table = new Table(this, 'analytics-table', {
      tableName: 'integ-test-analytics',
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
      databaseName: 'ddb-s3-athena',
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
      dataFormat: {
        inputFormat: new InputFormat('org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'),
        outputFormat: new OutputFormat('org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'),
        serializationLibrary: new SerializationLibrary('org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'),
      },
      s3Prefix: 'data',
      bucket: landingBucket,
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
        bufferingHints: {
          sizeInMBs: 128,
          intervalInSeconds: 60,
        },
        compressionFormat: 'UNCOMPRESSED',
        errorOutputPrefix: `error/!{firehose:error-output-type}/dt=!{timestamp:yyyy'-'MM'-'dd}/h=!{timestamp:HH}/`,
        prefix: 'data/date=!{partitionKeyFromQuery:date}',
        dynamicPartitioningConfiguration: {
          enabled: true,
          retryOptions: {
            durationInSeconds: 300,
          },
        },
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: 'MetadataExtraction',
              parameters: [
                {
                  parameterName: 'MetadataExtractionQuery',
                  parameterValue: '{ date : .createdAt[0:10] }',
                },
                {
                  parameterName: 'JsonParsingEngine',
                  parameterValue: 'JQ-1.6',
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
