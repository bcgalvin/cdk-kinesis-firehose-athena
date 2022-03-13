import * as path from 'path';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class DynamoSeeder extends Construct {
  public readonly seedBucket: IBucket;

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

    new CfnOutput(this, 's3-seed-bucket-output', {
      description: 'Seed s3 bucket name',
      value: seedBucket.bucketName,
    });

    this.seedBucket = seedBucket;
  }
}
