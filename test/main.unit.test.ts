import { App } from 'aws-cdk-lib';
// @ts-ignore
import { getTestAssets } from './util';

describe('DynamoSeeder Construct', () => {
  const app = new App();

  const { assert } = getTestAssets(app);

  test('stack should have an s3 bucket', () => {
    assert.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('s3 bucket has correct properties', () => {
    assert.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });
});
