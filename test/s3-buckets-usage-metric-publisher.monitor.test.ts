import path from 'path';
import * as AWSMock from 'aws-sdk-mock';
import { monitor } from '../src/s3-buckets-usage-metric-publisher.monitor';

AWSMock.setSDK(path.resolve('./node_modules/aws-sdk'));

// Silence log output
(['log', 'error'] as jest.FunctionPropertyNames<Required<Console>>[]).forEach((func) =>
  jest.spyOn(console, func).mockImplementation(() => {}),
);

describe('monitor', () => {
  beforeEach(() => {
    process.env.CW_NAMESPACE = 'test-namespace';
    AWSMock.mock('S3', 'listBuckets', mockListBuckets);
    AWSMock.mock('CloudWatch', 'putMetricData', (params: AWS.CloudWatch.PutMetricDataInput, callback) => {
      console.log(params);
      callback(undefined, {});
    });
  });

  afterEach(() => {
    AWSMock.restore();
  });

  const mockListBuckets = jest.fn(() => {
    return { Buckets: [{ Name: 'bucket1' }, { Name: 'bucket2' }, { Name: 'bucket3' }, { Name: 'bucket4' }] };
  });

  it('should publish metric data to CloudWatch', async () => {
    const result = await monitor();
    expect(result).toEqual({ numberOfBuckets: 4 });
  });

  it('should throw an error if CW_NAMESPACE environment variable is not set', async () => {
    delete process.env.CW_NAMESPACE;
    await expect(monitor()).rejects.toThrow('CW_NAMESPACE environment variable not set');
  });

  it('should log "No results to publish" if there are no results', async () => {
    AWSMock.remock(
      'S3',
      'listBuckets',
      jest.fn(() => {
        return { numberOfBuckets: 0 };
      }),
    );
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const result = await monitor();
    expect(result).toEqual({ numberOfBuckets: 0 });
    expect(consoleSpy).toHaveBeenCalledWith('No results to publish');
    consoleSpy.mockRestore();
  });

  it('should throw an error if there is an error publishing metric data', async () => {
    AWSMock.remock('CloudWatch', 'putMetricData', (params: AWS.CloudWatch.PutMetricDataInput, callback) => {
      callback(
        {
          code: '1',
          message: `Intentional mock failure: ${params}`,
          time: new Date(),
          name: 'MockECSAWSError',
        },
        undefined,
      );
    });
    await expect(monitor()).rejects.toBeDefined();
  });
});
