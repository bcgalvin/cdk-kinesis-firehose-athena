package dynamo

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/domain"
)

type Interface interface {
	WriteCounties(county domain.County, tableName string) error
	DeleteAllCounties(tableName string) error
}

type ddbInterface interface {
	dynamodb.QueryAPIClient
	dynamodb.ScanAPIClient
	DeleteItem(ctx context.Context, params *dynamodb.DeleteItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.DeleteItemOutput, error)
	BatchWriteItem(ctx context.Context, params *dynamodb.BatchWriteItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.BatchWriteItemOutput, error)
}
