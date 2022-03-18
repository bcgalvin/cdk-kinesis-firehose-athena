import { RemovalPolicy } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption, BucketProps, CfnBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface EventBucketProps extends BucketProps {}

export class EventBucket extends Bucket {
  constructor(scope: Construct, id: string, props: EventBucketProps = {}) {
    super(scope, id, {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      ...props,
    });
    const cfnBucket = this.node.defaultChild as CfnBucket;
    cfnBucket.addPropertyOverride('NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled', true);
  }
}
