import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, ITable, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { IStream, Stream, StreamEncryption, StreamMode } from 'aws-cdk-lib/aws-kinesis';
import { BlockPublicAccess, Bucket, BucketEncryption, CfnBucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface EventStorageProps {
  bucketName?: string;
  tableName?: string;
  streamName?: string;
}

export class EventStorage extends Construct {
  public readonly bucket: IBucket;
  public readonly stream: IStream;
  public readonly table: ITable;

  constructor(scope: Construct, id: string, props?: EventStorageProps) {
    super(scope, id);

    const bucket = new Bucket(this, 'bucket', {
      bucketName: props?.bucketName || undefined,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    (bucket.node.defaultChild as CfnBucket).notificationConfiguration = {
      eventBridgeConfiguration: {
        eventBridgeEnabled: true,
      },
    };

    this.bucket = bucket;

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

    new StringParameter(this, 'bucket-parameter', {
      parameterName: '/event-storage/bucket',
      stringValue: bucket.bucketName,
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
