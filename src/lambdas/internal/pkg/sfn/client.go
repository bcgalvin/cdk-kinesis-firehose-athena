package sfn

import (
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
)

type Client struct {
	sfn sfnInterface
}

func New(cfg aws.Config) *Client {
	return &Client{
		sfn: sfn.NewFromConfig(cfg),
	}
}
