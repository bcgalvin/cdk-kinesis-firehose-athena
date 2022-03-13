import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { Construct } from 'constructs';
import { DynamoSeeder } from '../src';

export class TestSeederStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new DynamoSeeder(this, 'snapshot-construct');
  }
}

export function getSeederTestAssets(app: App) {
  const stack = new TestSeederStack(app, 'test-stack');

  const assert = Template.fromStack(stack);
  return {
    assert,
    stack,
    app,
  };
}
