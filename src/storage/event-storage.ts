import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, ITable, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { IStream, Stream, StreamEncryption, StreamMode } from 'aws-cdk-lib/aws-kinesis';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { EventBucket } from './eventbridge-enabled-bucket';

export interface EventStorageProps {
  tableName?: string;
  streamName?: string;
}

export class EventStorage extends Construct {
  public readonly rawBucket: IBucket;
  public readonly landingBucket: IBucket;
  public readonly stagingBucket: IBucket;
  public readonly stream: IStream;
  public readonly table: ITable;

  constructor(scope: Construct, id: string, props?: EventStorageProps) {
    super(scope, id);

    this.rawBucket = new EventBucket(this, 'raw-bucket');
    this.landingBucket = new EventBucket(this, 'landing-bucket');
    this.stagingBucket = new EventBucket(this, 'staging-bucket');

    this.stream = new Stream(this, 'stream', {
      streamName: props?.streamName || undefined,
      encryption: StreamEncryption.MANAGED,
      streamMode: StreamMode.ON_DEMAND,
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
      parameterName: '/event-storage/raw-bucket',
      stringValue: this.rawBucket.bucketName,
    });

    new StringParameter(this, 'landing-bucket-parameter', {
      parameterName: '/event-storage/landing-bucket',
      stringValue: this.landingBucket.bucketName,
    });

    new StringParameter(this, 'staging-bucket-parameter', {
      parameterName: '/event-storage/staging-bucket',
      stringValue: this.stagingBucket.bucketName,
    });

    new StringParameter(this, 'ddb-table-parameter', {
      parameterName: '/event-storage/table',
      stringValue: this.table.tableName,
    });

    new StringParameter(this, 'stream-parameter', {
      parameterName: '/event-storage/stream',
      stringValue: this.table.tableName,
    });
  }
}
