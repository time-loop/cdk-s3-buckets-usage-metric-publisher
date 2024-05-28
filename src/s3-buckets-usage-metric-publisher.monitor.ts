/**
 * The Lambda function resource is managed from s3-buckets-usage-metric-publisher.ts
 */
import { CloudWatch, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { ListBucketsCommand, S3 } from '@aws-sdk/client-s3';

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
    const s3 = new S3();
    const { Buckets = [] } = await s3.send(new ListBucketsCommand());

    const numberOfBuckets = Buckets.length;
    console.log('Number of S3 buckets:', numberOfBuckets);

    const cloudwatch = new CloudWatch();
    try {
      await cloudwatch.send(
        new PutMetricDataCommand({
          Namespace: cwNamespace,
          MetricData: [
            {
              MetricName: 'NumberOfS3GeneralPurposeBuckets',
              Dimensions: [{ Name: 'BucketCount', Value: 'Total' }],
              Unit: 'Count',
              Value: numberOfBuckets,
            },
          ],
        }),
      );
    } catch (error) {
      console.error('Error publishing metric data');
      throw error;
    }

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
