import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
// @ts-ignore
import { getSeederTestAssets } from './util';

test('Snapshot', () => {
  const { stack } = getSeederTestAssets(new App());

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
