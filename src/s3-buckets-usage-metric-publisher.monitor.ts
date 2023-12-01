/**
 * The Lambda function resource is managed from s3-buckets-usage-metric-publisher.ts
 */
import * as AWS from 'aws-sdk';

/**
 * Monitor the number of S3 buckets by Lambda functions in an AWS account and publish the metric data to CloudWatch.
 * @throws An error if the CW_NAMESPACE environment variable are not set, or if there is an error publishing the metric data to CloudWatch.
 */
export const monitor = async () => {
  try {
    const cwNamespace = process.env.CW_NAMESPACE;

    if (!cwNamespace) {
      throw new Error('CW_NAMESPACE environment variable not set');
    }

    // Call the listBuckets API to get a list of all S3 buckets
    const s3 = new AWS.S3();
    const { Buckets = [] } = await s3.listBuckets().promise();

    const numberOfBuckets = Buckets.length;
    console.log('Number of S3 buckets:', numberOfBuckets);

    const cloudwatch = new AWS.CloudWatch();
    const dimensions = [{ Name: 'BucketCount', Value: 'Total' }];
    const metricData = [
      {
        MetricName: 'NumberOfS3GeneralPurposeBuckets',
        Dimensions: dimensions,
        Unit: 'Count',
        Value: numberOfBuckets,
      },
    ];
    const params = {
      Namespace: cwNamespace,
      MetricData: metricData,
    };
    cloudwatch.putMetricData(params, (err) => {
      if (err) {
        throw err;
      } else {
        console.log(`Successfully pushed metric data to namespace ${cwNamespace} - ${metricData}`);
      }
    });

    if (numberOfBuckets === 0) {
      console.log('No results to publish');
    } else {
      console.log('Successfully pushed metric data');
    }
    return { numberOfBuckets: numberOfBuckets };
  } catch (error) {
    console.error('Error publishing metric data');
    throw error;
  }
};
