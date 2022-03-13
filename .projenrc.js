const { awscdk } = require('projen');

const cdkVersion = '2.16.0';
const commonIgnore = ['.idea', '.Rproj', '.vscode', 'cdk.context.json', '.DS_Store'];
const deps = [
  `aws-cdk-lib@${cdkVersion}`,
  'constructs@10.0.5',
  `@aws-cdk/aws-kinesisfirehose-destinations-alpha@${cdkVersion}-alpha.0`,
];

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Bryan Galvin',
  authorAddress: 'bcgalvin@gmail.com',
  name: 'cdk-kinesis-firehose-athena',
  repositoryUrl: 'https://github.com/bcgalvin/cdk-kinesis-firehose-athena.git',
  description: 'A CDK construct library sample.',
  keywords: ['aws-cdk', 'dynamodb', 'kinesis', 'athena'],
  // Testing & Linting
  codeCov: true,
  eslint: true,
  eslintOptions: {
    prettier: true,
  },
  prettier: true,
  prettierOptions: {
    settings: {
      printWidth: 120,
      trailingComma: 'all',
      arrowParens: 'always',
      singleQuote: true,
    },
  },
  // Ignore files
  gitignore: commonIgnore,
  npmignore: commonIgnore,
  // Dependencies
  cdkVersion: cdkVersion,
  deps: deps,
  devDeps: [...deps, 'eslint-config-prettier', 'eslint-plugin-prettier', 'prettier', '@types/cfn-response'],
  peerDeps: deps,
  depsUpgrade: true,
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: ['bcgalvin'],
    label: 'auto-approve',
    secret: 'GITHUB_TOKEN',
  },
  // Release
  defaultReleaseBranch: 'main',
  release: false,
  releaseToNpm: false,
  githubOptions: {
    pullRequestLint: false,
  },
});

project.addTask('format', {
  description: 'Format with prettier',
  exec: 'prettier --write src/{**/,}*.ts test/{**/,}*.ts .projenrc.js README.md',
});

project.tasks.tryFind('package').prependExec('go env -w GOSUMDB=off');

project.synth();
