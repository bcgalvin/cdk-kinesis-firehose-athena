import { Database, DataFormat, IDatabase, ITable, Schema, Table } from '@aws-cdk/aws-glue-alpha';
import { Aws } from 'aws-cdk-lib';
import { CfnWorkGroup } from 'aws-cdk-lib/aws-athena';

import { IStream } from 'aws-cdk-lib/aws-kinesis';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface GlueStorageProps {
  bucket: IBucket;
  stream: IStream;
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
          name: 'PK',
          type: Schema.STRING,
        },
        {
          name: 'SK',
          type: Schema.STRING,
        },
      ],
      storedAsSubDirectories: true,
      dataFormat: DataFormat.PARQUET,
      s3Prefix: 'data/',
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
      parameterName: '/glue-storage/table',
      stringValue: `${this.database.databaseName}-${this.table.tableName}`,
    });
  }
}
