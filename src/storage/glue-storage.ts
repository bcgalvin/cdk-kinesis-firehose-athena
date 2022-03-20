import { Database, DataFormat, IDatabase, ITable, Schema, Table } from '@aws-cdk/aws-glue-alpha';
import { Aws } from 'aws-cdk-lib';
import { CfnWorkGroup } from 'aws-cdk-lib/aws-athena';

import { CfnCrawler } from 'aws-cdk-lib/aws-glue';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IStream } from 'aws-cdk-lib/aws-kinesis';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface GlueStorageProps {
  project: string;
  bucket: IBucket;
  stream: IStream;
  prefix: string;
  crawlerName: string;
}

export class GlueStorage extends Construct {
  public readonly table: ITable;
  public readonly database: IDatabase;

  constructor(scope: Construct, id: string, props: GlueStorageProps) {
    super(scope, id);

    this.database = new Database(this, 'glue-db', {
      databaseName: 'ddb_athena',
    });

    this.table = new Table(this, 'glue-table', {
      database: this.database,
      tableName: 'seeder',
      columns: [
        {
          name: 'CensusId',
          type: Schema.STRING,
        },
        {
          name: 'State',
          type: Schema.STRING,
        },
        {
          name: 'County',
          type: Schema.STRING,
        },
        {
          name: 'TotalPop',
          type: Schema.STRING,
        },
        {
          name: 'Men',
          type: Schema.STRING,
        },
        {
          name: 'Women',
          type: Schema.STRING,
        },
        {
          name: 'Hispanic',
          type: Schema.STRING,
        },
        {
          name: 'White',
          type: Schema.STRING,
        },
        {
          name: 'Black',
          type: Schema.STRING,
        },
        {
          name: 'Native',
          type: Schema.STRING,
        },
        {
          name: 'Asian',
          type: Schema.STRING,
        },
        {
          name: 'Pacific',
          type: Schema.STRING,
        },
        {
          name: 'Citizen',
          type: Schema.STRING,
        },
        {
          name: 'Income',
          type: Schema.STRING,
        },
        {
          name: 'IncomeErr',
          type: Schema.STRING,
        },
        {
          name: 'IncomePerCap',
          type: Schema.STRING,
        },
        {
          name: 'IncomePerCapErr',
          type: Schema.STRING,
        },
        {
          name: 'Poverty',
          type: Schema.STRING,
        },
        {
          name: 'ChildPoverty',
          type: Schema.STRING,
        },
        {
          name: 'Professional',
          type: Schema.STRING,
        },
        {
          name: 'Service',
          type: Schema.STRING,
        },
        {
          name: 'Office',
          type: Schema.STRING,
        },
        {
          name: 'Construction',
          type: Schema.STRING,
        },
        {
          name: 'Production',
          type: Schema.STRING,
        },
        {
          name: 'Drive',
          type: Schema.STRING,
        },

        {
          name: 'Carpool',
          type: Schema.STRING,
        },
        {
          name: 'Transit',
          type: Schema.STRING,
        },
        {
          name: 'Walk',
          type: Schema.STRING,
        },
        {
          name: 'OtherTransp',
          type: Schema.STRING,
        },
        {
          name: 'WorkAtHome',
          type: Schema.STRING,
        },
        {
          name: 'MeanCommute',
          type: Schema.STRING,
        },
        {
          name: 'Employed',
          type: Schema.STRING,
        },
        {
          name: 'PrivateWork',
          type: Schema.STRING,
        },
        {
          name: 'PublicWork',
          type: Schema.STRING,
        },
        {
          name: 'SelfEmployed',
          type: Schema.STRING,
        },
        {
          name: 'FamilyWork',
          type: Schema.STRING,
        },
        {
          name: 'Unemployment',
          type: Schema.STRING,
        },
      ],
      dataFormat: DataFormat.PARQUET,
      s3Prefix: props.prefix,
      partitionKeys: [
        {
          name: 'year',
          type: Schema.STRING,
        },
        {
          name: 'month',
          type: Schema.STRING,
        },
        {
          name: 'day',
          type: Schema.STRING,
        },
      ],
      bucket: props.bucket,
    });

    const crawlerRole = new Role(this, `MyGlueCrawlerRole`, {
      assumedBy: new ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(
          this,
          `AWSGluePolicy`,
          'arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole',
        ),
      ],
    });
    props.bucket.grantReadWrite(crawlerRole);

    new CfnCrawler(this, 'MyGlueCrawler', {
      name: props.crawlerName,
      databaseName: this.database.databaseName,
      role: crawlerRole.roleArn,
      targets: {
        catalogTargets: [
          {
            databaseName: this.database.databaseName,
            tables: [this.table.tableName],
          },
        ],
      },
      schemaChangePolicy: {
        deleteBehavior: 'LOG',
      },
    });

    new CfnWorkGroup(this, 'athena-workgroup', {
      name: Aws.STACK_NAME,
      recursiveDeleteOption: true,
      state: 'ENABLED',
      workGroupConfiguration: {
        enforceWorkGroupConfiguration: true,
        resultConfiguration: {
          outputLocation: `s3://${props.bucket.bucketName}/results`,
        },
      },
    });

    new StringParameter(this, 'glue-table-parameter', {
      parameterName: `/${props.project}/glue-table`,
      stringValue: `${this.database.databaseName}-${this.table.tableName}`,
    });
  }
}
