# S3BucketsUsageMetricPublisher
A construct that creates an AWS Lambda function to publish S3 General Purpose buckets usage metrics to CloudWatch.

## Usage
To use the `S3BucketsUsageMetricPublisher` construct, simply import it into your AWS CDK stack and create a new instance of the construct:

``` ts
import { Stack } from 'aws-cdk-lib';
import { S3BucketsUsageMetricPublisher } from './s3-buckets-usage-metric-publisher';

const stack = new Stack(app, 'MyStack');

new S3BucketsUsageMetricPublisher(stack, 'MyS3BucketsUsageMetricPublisher', {
  publishFrequency: 5,
  cwNamespace: 'MyNamespace',
});
```

This will create a new AWS Lambda function that publishes the number of S3 bucket to CloudWatch every 5 minutes for the `us-east-1` and `us-west-2` regions, using the `MyNamespace` namespace.

## API
`S3BucketsUsageMetricPublisher(scope: Construct, id: string, props: S3BucketsUsageMetricPublisherProps)`

Creates a new instance of the `S3BucketsUsageMetricPublisher` construct.

### Parameters
- `scope` - The parent construct.
- `id` - The ID of the construct.
- `props` - The properties of the construct.

### Properties
- `publishFrequency` - The time interval (in minutes) that the Lambda function will be triggered to publish metrics to CloudWatch.
- `handler` - The AWS Lambda function that publishes usage metrics to CloudWatch.
- `rule` - The CloudWatch Events rule that triggers the Lambda function to publish metrics to CloudWatch.
- `cwNamespace` - The CloudWatch namespace to publish metrics to.

## License
This library is licensed under the Apache 2.0 License. See the LICENSE file.
