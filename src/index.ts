import { Database, DataFormat, Schema, Table as gTable } from '@aws-cdk/aws-glue-alpha';
import { Aws, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { CfnWorkGroup } from 'aws-cdk-lib/aws-athena';
import { AttributeType, BillingMode, ITable, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { IStream, Stream, StreamEncryption, StreamMode } from 'aws-cdk-lib/aws-kinesis';
import { BlockPublicAccess, Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { S3FirehoseDelivery } from './ingestion';

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

    new S3FirehoseDelivery(this, 'S3Delivery', {
      bucket: landingBucket,
      stream: stream,
      glueDatabaseName: glueDatabase.databaseName,
      glueTableName: glueTable.tableName,
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
