package dynamo

import (
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type Client struct {
	ddb ddbInterface
}

func New(cfg aws.Config) *Client {
	return &Client{ddb: dynamodb.NewFromConfig(cfg)}
}
