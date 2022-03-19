import * as path from 'path';
import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import { Aws, RemovalPolicy } from 'aws-cdk-lib';

import { ArnPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IStream } from 'aws-cdk-lib/aws-kinesis';
import { CfnDeliveryStream } from 'aws-cdk-lib/aws-kinesisfirehose';
import { ILogGroup, LogGroup, LogStream, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface S3FirehoseDeliveryProps {
  bucket: IBucket;
  stream: IStream;
  glueDatabaseName: string;
  glueTableName: string;
  logGroupName?: string;
}

export class S3FirehoseDelivery extends Construct {
  public readonly kinesisLogGroup: ILogGroup;
  public readonly kinesisDeliveryLambda: GoFunction;
  public readonly S3DeliveryStream: CfnDeliveryStream;

  constructor(scope: Construct, id: string, props: S3FirehoseDeliveryProps) {
    super(scope, id);

    this.kinesisLogGroup = new LogGroup(this, 'delivery-log-group', {
      retention: RetentionDays.ONE_WEEK,
      logGroupName: props?.logGroupName || '/aws/kinesisfirehose/ddb-athena',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new LogStream(this, 'delivery-log-stream', {
      logGroup: this.kinesisLogGroup,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const ingestionRole = new Role(this, 'ingestion-role', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        AllowFirehose: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['kinesis:DescribeStream', 'kinesis:GetRecords', 'kinesis:GetShardIterator'],
              effect: Effect.ALLOW,
              resources: [props.stream.streamArn],
            }),

            new PolicyStatement({
              actions: ['glue:GetTableVersions'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    this.kinesisDeliveryLambda = new GoFunction(this, 'firehose-enricher-lambdas', {
      entry: path.resolve(__dirname, '../lambdas/firehose-enricher'),
      logRetention: RetentionDays.THREE_DAYS,
    });

    props.bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ['s3:*'],
        resources: [props.bucket.bucketArn, props.bucket.arnForObjects('*')],
        principals: [new ArnPrincipal(ingestionRole.roleArn)],
      }),
    );

    props.stream.grantReadWrite(ingestionRole);
    props.bucket.grantWrite(ingestionRole);
    this.kinesisLogGroup.grantWrite(ingestionRole);
    this.kinesisDeliveryLambda.grantInvoke(ingestionRole);

    this.S3DeliveryStream = new CfnDeliveryStream(this, 'delivery-stream', {
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: props.stream.streamArn,
        roleArn: ingestionRole.roleArn,
      },
      extendedS3DestinationConfiguration: {
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: '/aws/kinesisfirehose/test-stream',
          logStreamName: 'S3FirehoseDelivery',
        },
        bucketArn: props.bucket.bucketArn,
        compressionFormat: 'UNCOMPRESSED',
        errorOutputPrefix: `error/!{firehose:error-output-type}/dt=!{timestamp:yyyy'-'MM'-'dd}/h=!{timestamp:HH}/`,
        prefix:
          'data/year=!{partitionKeyFromLambda:year}/month=!{partitionKeyFromLambda:month}/day=!{partitionKeyFromLambda:day}/',
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: 'Lambda',
              parameters: [
                {
                  parameterName: 'LambdaArn',
                  parameterValue: this.kinesisDeliveryLambda.functionArn,
                },
              ],
            },
            {
              type: 'AppendDelimiterToRecord',
              parameters: [
                {
                  parameterName: 'Delimiter',
                  parameterValue: '\\n',
                },
              ],
            },
          ],
        },
        dynamicPartitioningConfiguration: {
          enabled: true,
        },
        bufferingHints: {
          intervalInSeconds: 60,
        },
        roleArn: ingestionRole.roleArn,
        dataFormatConversionConfiguration: {
          schemaConfiguration: {
            roleArn: ingestionRole.roleArn,
            catalogId: Aws.ACCOUNT_ID,
            databaseName: props.glueDatabaseName,
            tableName: props.glueTableName,
            region: Aws.REGION,
          },
          inputFormatConfiguration: {
            deserializer: {
              openXJsonSerDe: {},
            },
          },
          outputFormatConfiguration: {
            serializer: {
              parquetSerDe: {},
            },
          },
          enabled: true,
        },
      },
    });
  }
}
