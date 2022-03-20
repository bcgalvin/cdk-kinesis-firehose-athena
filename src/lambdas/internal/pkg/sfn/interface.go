package sfn

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
)

type Interface interface {
	DescribeExecution(executionArn string) error
}

type sfnInterface interface {
	DescribeExecution(context.Context, *sfn.DescribeExecutionInput, ...func(options *sfn.Options)) (*sfn.DescribeExecutionOutput, error)
}
