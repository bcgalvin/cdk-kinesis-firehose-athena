import { Construct } from 'constructs';
import { S3FirehoseDelivery } from './ingestion';
import { EventStorage, GlueStorage } from './storage';

export interface DynamoAthenaSeederProps {
  prefix: string;
}

export class DynamoAthenaSeeder extends Construct {
  constructor(scope: Construct, id: string, props: DynamoAthenaSeederProps) {
    super(scope, id);

    const eventStorage = new EventStorage(this, 'EventStorage');

    const athenaResources = new GlueStorage(this, 'Athena', {
      stream: eventStorage.stream,
      bucket: eventStorage.bucket,
      prefix: props.prefix,
    });

    new S3FirehoseDelivery(this, 'S3FirehoseDelivery', {
      bucket: eventStorage.bucket,
      stream: eventStorage.stream,
      glueDatabaseName: athenaResources.database.databaseName,
      glueTableName: athenaResources.table.tableName,
    });
  }
}
