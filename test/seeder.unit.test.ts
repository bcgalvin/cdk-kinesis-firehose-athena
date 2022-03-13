import { App } from 'aws-cdk-lib';
// @ts-ignore
import { getSeederTestAssets } from './util';

describe('DynamoSeeder Construct', () => {
  const app = new App();

  const { assert } = getSeederTestAssets(app);

  test('construct should have a s3 bucket', () => {
    assert.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('construct should have a ddb table', () => {
    assert.resourceCountIs('AWS::DynamoDB::Table', 1);
  });

  test('construct should have an s3 bucket deployment custom resource', () => {
    assert.resourceCountIs('Custom::CDKBucketDeployment', 1);
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

  test('table has correct properties', () => {
    assert.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'gsi',
          KeySchema: [
            {
              AttributeName: 'PK1',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'SK1',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
    });
  });
});
