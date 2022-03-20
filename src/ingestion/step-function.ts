import * as path from 'path';
import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { JsonPath, StateMachine, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { DynamoAttributeValue, DynamoPutItem, DynamoUpdateItem } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export class SfnSeedTask extends Construct {
  public readonly table: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const auditTable = new Table(this, 'audit-table', {
      partitionKey: {
        name: 'taskId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: AttributeType.NUMBER,
      },
      tableName: 'Tasks',
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const logStartTask = new DynamoPutItem(this, 'create-ddb-item', {
      item: {
        taskId: DynamoAttributeValue.fromString(JsonPath.stringAt('$.taskId')),
        timestamp: DynamoAttributeValue.numberFromString(JsonPath.stringAt(`States.Format('{}', ${'$.timestamp'})`)),
        Status: DynamoAttributeValue.fromString('STARTED'),
      },
      table: auditTable,

      resultPath: JsonPath.DISCARD,
    });

    const waitX = new Wait(this, 'Execute long running task...wait 30 seconds', {
      time: WaitTime.duration(Duration.seconds(30)),
    });

    const logEndTask = new DynamoUpdateItem(this, 'UpdateDynamoTaskItem', {
      key: {
        taskId: DynamoAttributeValue.fromString(JsonPath.stringAt('$.taskId')),
        timestamp: DynamoAttributeValue.numberFromString(JsonPath.stringAt(`States.Format('{}', ${'$.timestamp'})`)),
      },
      table: auditTable,
      expressionAttributeValues: {
        ':val': DynamoAttributeValue.fromString('Done'),
      },
      expressionAttributeNames: {
        '#s': 'Status',
      },
      updateExpression: 'SET #s = :val',
    });

    const definition = logStartTask.next(waitX).next(logEndTask);
    const stateMachine = new StateMachine(this, 'StateMachine', {
      definition,
    });
    auditTable.grantWriteData(stateMachine);

    const invokeStepFunction = new GoFunction(this, 'invokeStepFunction', {
      entry: path.resolve(__dirname, '../lambdas/cmd/dynamodb-seeder'),
      environment: {
        StateMachineArn: stateMachine.stateMachineArn,
      },
      functionName: 'InvokeTaskStepFunction',
    });

    stateMachine.grantStartExecution(invokeStepFunction);

    this.table = auditTable;
  }
}
