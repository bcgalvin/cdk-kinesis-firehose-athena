import { App } from 'aws-cdk-lib';
// @ts-ignore
import { getTestAssets } from './util';

describe('Placeholder', () => {
  const app = new App();

  const { assert } = getTestAssets(app);

  test('stack should have kinesis stream', () => {
    assert.resourceCountIs('AWS::Kinesis::Stream', 0);
  });
});
