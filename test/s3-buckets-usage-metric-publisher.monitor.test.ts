import { CloudWatchClient, PutMetricDataCommand, PutMetricDataCommandInput } from '@aws-sdk/client-cloudwatch';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { monitor } from '../src/s3-buckets-usage-metric-publisher.monitor';

const s3Mock = mockClient(S3Client);
const cwMock = mockClient(CloudWatchClient);

// Silence log output
(['log', 'error'] as jest.FunctionPropertyNames<Required<Console>>[]).forEach((func) =>
  jest.spyOn(console, func).mockImplementation(() => {}),
);

describe('monitor', () => {
  beforeEach(() => {
    cwMock.reset();
    s3Mock.reset();

    process.env.CW_NAMESPACE = 'test-namespace';
  });

  it('should publish metric data to CloudWatch', async () => {
    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [{ Name: 'bucket1' }, { Name: 'bucket2' }, { Name: 'bucket3' }, { Name: 'bucket4' }],
    });

    cwMock.on(PutMetricDataCommand).callsFake((params: PutMetricDataCommandInput, callback) => {
      console.log(params);
      callback();
    });

    const result = await monitor();
    expect(result).toEqual({ numberOfBuckets: 4 });
  });

  it('should throw an error if CW_NAMESPACE environment variable is not set', async () => {
    delete process.env.CW_NAMESPACE;
    await expect(monitor()).rejects.toThrow('CW_NAMESPACE environment variable not set');
  });

  it('should log "No results to publish" if there are no results', async () => {
    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [],
    });

    cwMock.on(PutMetricDataCommand).callsFake((params: PutMetricDataCommandInput, callback) => {
      console.log(params);
      callback();
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const result = await monitor();
    expect(result).toEqual({ numberOfBuckets: 0 });
    expect(consoleSpy).toHaveBeenCalledWith('No results to publish');
    consoleSpy.mockRestore();
  });

  it('should throw an error if there is an error publishing metric data', async () => {
    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [{ Name: 'bucket1' }, { Name: 'bucket2' }, { Name: 'bucket3' }, { Name: 'bucket4' }],
    });

    cwMock.on(PutMetricDataCommand).callsFake((params: PutMetricDataCommandInput) => {
      return Promise.reject({
        code: '1',
        message: `Intentional mock failure: ${params}`,
        time: new Date(),
        name: 'MockECSAWSError',
      });
    });
    await expect(monitor()).rejects.toBeDefined();
  });
});
