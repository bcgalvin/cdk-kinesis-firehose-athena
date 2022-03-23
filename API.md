# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### DynamoAthenaSeeder <a name="DynamoAthenaSeeder" id="cdk-kinesis-firehose-athena.DynamoAthenaSeeder"></a>

#### Initializers <a name="Initializers" id="cdk-kinesis-firehose-athena.DynamoAthenaSeeder.Initializer"></a>

```typescript
import { DynamoAthenaSeeder } from 'cdk-kinesis-firehose-athena'

new DynamoAthenaSeeder(scope: Construct, id: string, props: DynamoAthenaSeederProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeeder.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeeder.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeeder.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeederProps">DynamoAthenaSeederProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-kinesis-firehose-athena.DynamoAthenaSeeder.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-kinesis-firehose-athena.DynamoAthenaSeeder.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-kinesis-firehose-athena.DynamoAthenaSeeder.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeederProps">DynamoAthenaSeederProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeeder.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cdk-kinesis-firehose-athena.DynamoAthenaSeeder.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeeder.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-kinesis-firehose-athena.DynamoAthenaSeeder.isConstruct"></a>

```typescript
import { DynamoAthenaSeeder } from 'cdk-kinesis-firehose-athena'

DynamoAthenaSeeder.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-kinesis-firehose-athena.DynamoAthenaSeeder.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeeder.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-kinesis-firehose-athena.DynamoAthenaSeeder.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---


## Structs <a name="Structs" id="Structs"></a>

### DynamoAthenaSeederProps <a name="DynamoAthenaSeederProps" id="cdk-kinesis-firehose-athena.DynamoAthenaSeederProps"></a>

#### Initializer <a name="Initializer" id="cdk-kinesis-firehose-athena.DynamoAthenaSeederProps.Initializer"></a>

```typescript
import { DynamoAthenaSeederProps } from 'cdk-kinesis-firehose-athena'

const dynamoAthenaSeederProps: DynamoAthenaSeederProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeederProps.property.alarmEmail">alarmEmail</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeederProps.property.crawlerName">crawlerName</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeederProps.property.dataPrefix">dataPrefix</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-kinesis-firehose-athena.DynamoAthenaSeederProps.property.projectName">projectName</a></code> | <code>string</code> | *No description.* |

---

##### `alarmEmail`<sup>Required</sup> <a name="alarmEmail" id="cdk-kinesis-firehose-athena.DynamoAthenaSeederProps.property.alarmEmail"></a>

```typescript
public readonly alarmEmail: string;
```

- *Type:* string

---

##### `crawlerName`<sup>Required</sup> <a name="crawlerName" id="cdk-kinesis-firehose-athena.DynamoAthenaSeederProps.property.crawlerName"></a>

```typescript
public readonly crawlerName: string;
```

- *Type:* string

---

##### `dataPrefix`<sup>Required</sup> <a name="dataPrefix" id="cdk-kinesis-firehose-athena.DynamoAthenaSeederProps.property.dataPrefix"></a>

```typescript
public readonly dataPrefix: string;
```

- *Type:* string

---

##### `projectName`<sup>Required</sup> <a name="projectName" id="cdk-kinesis-firehose-athena.DynamoAthenaSeederProps.property.projectName"></a>

```typescript
public readonly projectName: string;
```

- *Type:* string

---



