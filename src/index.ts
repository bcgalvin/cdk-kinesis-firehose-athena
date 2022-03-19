import { Construct } from 'constructs';
import { S3FirehoseDelivery } from './ingestion';
import { EventStorage, GlueStorage } from './storage';

export interface DynamoAthenaSeederProps {
  dataPrefix: string;
  projectName: string;
}

export class DynamoAthenaSeeder extends Construct {
  constructor(scope: Construct, id: string, props: DynamoAthenaSeederProps) {
    super(scope, id);

    const eventStorage = new EventStorage(this, 'event-storage', {
      project: props.projectName,
    });

    const glueResources = new GlueStorage(this, 'glue-resources', {
      stream: eventStorage.stream,
      bucket: eventStorage.landingBucket,
      prefix: props.dataPrefix,
      project: props.projectName,
    });

    new S3FirehoseDelivery(this, 's3-firehose-delivery', {
      bucket: eventStorage.landingBucket,
      stream: eventStorage.stream,
      glueDatabaseName: glueResources.database.databaseName,
      glueTableName: glueResources.table.tableName,
    });
  }
}
