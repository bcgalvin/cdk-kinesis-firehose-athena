import * as path from 'path';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, ITable, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { IStream, Stream, StreamEncryption, StreamMode } from 'aws-cdk-lib/aws-kinesis';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { EventBucket } from './eventbridge-enabled-bucket';

export interface EventStorageProps {
  project: string;
  tableName?: string;
  streamName?: string;
}

export class EventStorage extends Construct {
  public readonly rawBucket: IBucket;
  public readonly landingBucket: IBucket;
  public readonly stagingBucket: IBucket;
  public readonly stream: IStream;
  public readonly table: ITable;
  public readonly auditTable: ITable;

  constructor(scope: Construct, id: string, props: EventStorageProps) {
    super(scope, id);

    this.rawBucket = new EventBucket(this, 'raw-bucket');
    this.landingBucket = new EventBucket(this, 'landing-bucket');
    this.stagingBucket = new EventBucket(this, 'staging-bucket');

    new BucketDeployment(this, 'landing-bucket-seed-data', {
      sources: [Source.asset(path.join(__dirname, '../../assets/data'))],
      destinationBucket: this.rawBucket,
      destinationKeyPrefix: 'data',
    });

    this.stream = new Stream(this, 'stream', {
      streamName: props?.streamName || undefined,
      encryption: StreamEncryption.MANAGED,
      streamMode: StreamMode.ON_DEMAND,
    });

    this.auditTable = new Table(this, 'audit-table', {
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
    });

    this.table = new Table(this, 'ddb-table', {
      tableName: props?.tableName || undefined,
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
      kinesisStream: this.stream,
    });

    new StringParameter(this, 'raw-bucket-parameter', {
      parameterName: `/${props.project}/raw-bucket`,
      stringValue: this.rawBucket.bucketName,
    });

    new StringParameter(this, 'landing-bucket-parameter', {
      parameterName: `/${props.project}/landing-bucket`,
      stringValue: this.landingBucket.bucketName,
    });

    new StringParameter(this, 'staging-bucket-parameter', {
      parameterName: `/${props.project}/staging-bucket`,
      stringValue: this.stagingBucket.bucketName,
    });

    new StringParameter(this, 'ddb-table-parameter', {
      parameterName: `/${props.project}/ddb-table`,
      stringValue: this.table.tableName,
    });

    new StringParameter(this, 'stream-parameter', {
      parameterName: `/${props.project}/stream`,
      stringValue: this.table.tableName,
    });
  }
}
