import { clickupCdk } from '@time-loop/clickup-projen';
import { JsonPatch, javascript } from 'projen';

const name = 'cdk-s3-buckets-usage-metric-publisher';
const project = new clickupCdk.ClickUpCdkConstructLibrary({
  name,
  author: 'jose-clickup',
  authorAddress: 'jamoroso@clickup.com',
  cdkVersion: '2.105.0',
  defaultReleaseBranch: 'main',
  experimentalIntegRunner: true,
  gitignore: ['.vscode/**'],
  repositoryUrl: `https://github.com/time-loop/${name}.git`,
  projenrcTs: true,
  packageManager: javascript.NodePackageManager.PNPM,
  pnpmVersion: '9',
  bundledDeps: ['aws-sdk'],
  devDeps: ['@time-loop/clickup-projen', '@aws-cdk/integ-tests-alpha', 'aws-sdk-mock', '@aws-sdk/client-cloudwatch'],
  peerDeps: ['multi-convention-namer'],
});

// TODO remove aws-sdk v2, allowing us to remove bundledDeps requirement
project.npmrc.addConfig('node-linker', 'hoisted'); // PNPM support for bundledDeps https://pnpm.io/npmrc#node-linker

// Assume the usInfraDev role
const build = project.tryFindObjectFile('.github/workflows/build.yml');
build?.addOverride('jobs.build.permissions', { 'id-token': 'write' });
build?.patch(
  JsonPatch.add('/jobs/build/steps/0', {
    name: 'Configure AWS Credentials',
    uses: 'aws-actions/configure-aws-credentials@v2',
    with: {
      'aws-region': 'us-west-2',
      'role-to-assume': `arn:aws:iam::425845004253:role/${name}-github-actions-role`,
      'role-duration-seconds': 900,
    },
  }),
);
project.synth();
