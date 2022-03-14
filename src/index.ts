import * as path from 'path';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, ITable, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { IStream, Stream, StreamEncryption } from 'aws-cdk-lib/aws-kinesis';
import { BlockPublicAccess, Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class DynamoSeeder extends Construct {
  public readonly seedBucket: IBucket;
  public readonly stream: IStream;
  public readonly table: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const seedBucket = new Bucket(this, 'Bucket', {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    new BucketDeployment(this, 'seed-data-bucket-deployment', {
      sources: [Source.asset(path.join(__dirname, '../assets/data'))],
      destinationBucket: seedBucket,
      destinationKeyPrefix: 'data',
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

    new CfnOutput(this, 's3-seed-bucket-output', {
      description: 'Seed s3 bucket name',
      value: seedBucket.bucketName,
    });
    new CfnOutput(this, 'table-output', {
      description: 'Dynamodb table name',
      value: table.tableName,
    });

    this.seedBucket = seedBucket;
    this.stream = stream;
    this.table = table;
  }
}
