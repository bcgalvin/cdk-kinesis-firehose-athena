import { join } from 'path';
import { Aws, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, ITable, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { CfnDatabase, CfnTable } from 'aws-cdk-lib/aws-glue';
import { ArnPrincipal, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IStream, Stream, StreamEncryption } from 'aws-cdk-lib/aws-kinesis';
import { CfnDeliveryStream } from 'aws-cdk-lib/aws-kinesisfirehose';
import { BlockPublicAccess, Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class DynamoAthenaSeeder extends Construct {
  public readonly seedBucket: IBucket;
  public readonly stream: IStream;
  public readonly table: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

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
    });

    const table = new Table(this, 'analytics-table', {
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

    const glueDb = new CfnDatabase(this, 'GlueDatabase', {
      catalogId: Aws.ACCOUNT_ID,
      databaseInput: {},
    });
    const glueTable = new CfnTable(this, 'GlueTable', {
      catalogId: Aws.ACCOUNT_ID,
      databaseName: glueDb.ref,
      tableInput: {
        owner: 'owner',
        retention: 0,
        storageDescriptor: {
          columns: [
            {
              name: 'PK',
              type: 'string',
            },
            {
              name: 'SK',
              type: 'string',
            },
          ],
          inputFormat: 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
          compressed: false,
          numberOfBuckets: -1,
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
            parameters: {
              'serialization.format': '1',
            },
          },
          bucketColumns: [],
          sortColumns: [],
          storedAsSubDirectories: false,
        },
        partitionKeys: [
          {
            name: 'year',
            type: 'string',
          },
          {
            name: 'month',
            type: 'string',
          },
          {
            name: 'day',
            type: 'string',
          },
        ],
        tableType: 'EXTERNAL_TABLE',
      },
    });

    const ingestionRole = new Role(this, 'IngestionRole', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        default: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:*'],
              resources: [landingBucket.bucketArn, landingBucket.arnForObjects('*')],
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

    new CfnDeliveryStream(this, 'TelemetryIngestionStream', {
      extendedS3DestinationConfiguration: {
        bucketArn: landingBucket.bucketArn,
        bufferingHints: {
          sizeInMBs: 128,
          intervalInSeconds: 60,
        },
        compressionFormat: 'UNCOMPRESSED',
        errorOutputPrefix: `error/!{firehose:error-output-type}/dt=!{timestamp:yyyy'-'MM'-'dd}/h=!{timestamp:HH}/`,
        prefix: `${join(
          'year=!{partitionKeyFromQuery:year}',
          'month=!{partitionKeyFromQuery:month}',
          'day=!{partitionKeyFromQuery:day}',
        )}/`,
        roleArn: ingestionRole.roleArn,
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
                  parameterValue: '{ year : .createdAt[0:4], month : .createdAt[5:7], day : .createdAt[8:10] }',
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
        dataFormatConversionConfiguration: {
          enabled: true,
          schemaConfiguration: {
            catalogId: Aws.ACCOUNT_ID,
            databaseName: glueDb.ref,
            tableName: glueTable.ref,
            roleArn: ingestionRole.roleArn,
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
