import { Database, DataFormat, Schema, Table as gTable } from '@aws-cdk/aws-glue-alpha';
import { Aws } from 'aws-cdk-lib';
import { CfnWorkGroup } from 'aws-cdk-lib/aws-athena';
import { Construct } from 'constructs';
import { S3FirehoseDelivery } from './ingestion';
import { EventStorage } from './storage';

export class DynamoAthenaSeeder extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const eventStorage = new EventStorage(this, 'EventStorage');

    const glueDatabase = new Database(this, 'GlueDB', {
      databaseName: 'ddb_athena',
    });

    const glueTable = new gTable(this, 'GlueTable', {
      database: glueDatabase,
      tableName: 'seeder',
      columns: [
        {
          name: 'PK',
          type: Schema.TIMESTAMP,
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
      bucket: eventStorage.bucket,
    });

    new S3FirehoseDelivery(this, 'S3Delivery', {
      bucket: eventStorage.bucket,
      stream: eventStorage.stream,
      glueDatabaseName: glueDatabase.databaseName,
      glueTableName: glueTable.tableName,
    });

    // Athena Workgroup
    new CfnWorkGroup(this, 'AthenaWorkgroup', {
      name: Aws.STACK_NAME,
      recursiveDeleteOption: true,
      state: 'ENABLED',
      workGroupConfiguration: {
        enforceWorkGroupConfiguration: true,
        resultConfiguration: {
          outputLocation: `s3://${eventStorage.bucket.bucketName}/results`,
        },
      },
    });
  }
}
