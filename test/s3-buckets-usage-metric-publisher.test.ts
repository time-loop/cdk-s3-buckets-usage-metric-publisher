import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Namer } from 'multi-convention-namer';
import { S3BucketsUsageMetricPublisher, S3BucketsUsageMetricPublisherProps } from '../src';

let app: App;
let stack: Stack;

let template: Template;
let defaultS3BucketsUsageMetricPublisherProps: S3BucketsUsageMetricPublisherProps = {
  publishFrequency: 1,
  cwNamespace: 'S3GeneralPurposeBucketsUsage',
  cloudwatchLogsRetention: 7,
};
let s3BucketsUsageMetricPublisher: S3BucketsUsageMetricPublisher;

const createS3BucketsUsageMetricPublisher = function (id: string, props?: S3BucketsUsageMetricPublisherProps) {
  s3BucketsUsageMetricPublisher = new S3BucketsUsageMetricPublisher(
    stack,
    new Namer([id]),
    props as S3BucketsUsageMetricPublisherProps,
  );
  template = Template.fromStack(stack);
};

describe('S3BucketsUsageMetricPublisher', () => {
  describe('default', () => {
    beforeAll(() => {
      app = new App();
      stack = new Stack(app, 'test');
    });
    it('creates resources', () => {
      createS3BucketsUsageMetricPublisher('defaultProps', defaultS3BucketsUsageMetricPublisherProps);
      template.resourceCountIs('AWS::Lambda::Function', 2);
      expect(s3BucketsUsageMetricPublisher.publishFrequency).toEqual(1);
    });
    it('creates resources with default props', () => {
      defaultS3BucketsUsageMetricPublisherProps = {};
      createS3BucketsUsageMetricPublisher('noProps', defaultS3BucketsUsageMetricPublisherProps);
      template.resourceCountIs('AWS::Lambda::Function', 2);
      expect(s3BucketsUsageMetricPublisher.publishFrequency).toEqual(1);
    });
  });
});
