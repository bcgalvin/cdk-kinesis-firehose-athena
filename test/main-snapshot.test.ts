import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
// @ts-ignore
import { getTestAssets } from './util';

test('Snapshot', () => {
  const { stack } = getTestAssets(new App());

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
