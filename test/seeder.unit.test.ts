import { App } from 'aws-cdk-lib';
// @ts-ignore
import { getSeederTestAssets } from './util';

describe('DynamoSeeder Construct', () => {
  const app = new App();

  const { assert } = getSeederTestAssets(app);

  test('construct should have a s3 bucket', () => {
    assert.resourceCountIs('AWS::S3::Bucket', 3);
  });

  test('construct should have a ddb table', () => {
    assert.resourceCountIs('AWS::DynamoDB::Table', 2);
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
