import { App } from 'aws-cdk-lib';
import { TestStack } from './util';

const app = new App();
new TestStack(app, 'integ-stack');
app.synth();
