import { Construct } from 'constructs';
import { S3FirehoseDelivery } from './ingestion';
import { EventStorage, GlueStorage } from './storage';

export interface DynamoAthenaSeederProps {
  prefix: string;
}

export class DynamoAthenaSeeder extends Construct {
  constructor(scope: Construct, id: string, props: DynamoAthenaSeederProps) {
    super(scope, id);

    const eventStorage = new EventStorage(this, 'event-storage');

    const glueResources = new GlueStorage(this, 'glue-resources', {
      stream: eventStorage.stream,
      stagingBucket: eventStorage.stagingBucket,
      prefix: props.prefix,
    });

    new S3FirehoseDelivery(this, 's3-firehose-delivery', {
      stagingBucket: eventStorage.stagingBucket,
      stream: eventStorage.stream,
      glueDatabaseName: glueResources.database.databaseName,
      glueTableName: glueResources.table.tableName,
    });
  }
}
