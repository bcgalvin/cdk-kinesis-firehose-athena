import { App } from 'aws-cdk-lib';
import { TestSeederStack } from './util';

const app = new App();
new TestSeederStack(app, 'integ-stack');
app.synth();
