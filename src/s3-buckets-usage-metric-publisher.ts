import { aws_iam, aws_lambda_nodejs, aws_events, aws_events_targets, aws_logs, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Namer } from 'multi-convention-namer';

export interface S3BucketsUsageMetricPublisherProps {
  /**
   * How long to retain logs published to CloudWatch logs.
   * @default aws_logs.RetentionDays.THREE_MONTHS
   */
  readonly cloudwatchLogsRetention?: aws_logs.RetentionDays;
  /**
   * The CloudWatch namespace to publish metrics to.
   * @default 'S3GeneralPurposeBucketsUsage'
   */
  readonly cwNamespace?: string;
  /**
   * Time intervals that Lambda will be triggered to publish metric in CloudWatch.
   * @default 1
   */
  readonly publishFrequency?: number;
}

/**
 * A construct that creates an AWS Lambda function to publish S3 general purpose usage metrics to CloudWatch.
 */
export class S3BucketsUsageMetricPublisher extends Construct {
  readonly publishFrequency: number;
  readonly handler: aws_lambda_nodejs.NodejsFunction;
  readonly rule: aws_events.Rule;
  readonly cwNamespace: string;

  /**
   * Creates a new instance of S3BucketsUsageMetricPublisher.
   * @param scope The parent construct.
   * @param id The ID of the construct.
   * @param props The properties of the construct.
   */

  constructor(scope: Construct, id: Namer, props: S3BucketsUsageMetricPublisherProps) {
    super(scope, id.pascal);
    this.publishFrequency = props.publishFrequency ?? 1;
    this.cwNamespace = props.cwNamespace ?? 'S3GeneralPurposeBucketsUsage';
    const myConstruct = this;

    this.handler = new aws_lambda_nodejs.NodejsFunction(myConstruct, 'monitor', {
      bundling: {
        externalModules: ['aws-lambda'],
        minify: true,
      },
      handler: 'monitor',
      logRetention: props.cloudwatchLogsRetention ?? aws_logs.RetentionDays.THREE_MONTHS,
      memorySize: 512,
      timeout: Duration.seconds(45),
    });

    [
      new aws_iam.PolicyStatement({
        actions: ['s3:ListAllMyBuckets', 's3:ListBucket'],
        resources: ['*'],
      }),
      new aws_iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': props.cwNamespace ?? this.cwNamespace,
          },
        },
      }),
    ].forEach((policy) => this.handler.addToRolePolicy(policy));

    this.handler.addEnvironment('CW_NAMESPACE', props.cwNamespace ?? this.cwNamespace);

    this.rule = new aws_events.Rule(this, 'rule', {
      schedule: aws_events.Schedule.rate(Duration.minutes(this.publishFrequency)),
    });
    this.rule.addTarget(new aws_events_targets.LambdaFunction(this.handler));
  }
}
