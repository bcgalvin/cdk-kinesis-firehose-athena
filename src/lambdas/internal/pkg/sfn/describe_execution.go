package sfn

import (
	"context"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
)

func (c *Client) DescribeExecution(executionArn string) (*sfn.DescribeExecutionOutput, error) {
	input := &sfn.DescribeExecutionInput{
		ExecutionArn: aws.String(executionArn),
	}
	out, err := c.sfn.DescribeExecution(context.Background(), input)
	if err != nil {
		return &sfn.DescribeExecutionOutput{}, fmt.Errorf("unable to obtain step function execution arn name. The step function %s may be misconfigured. Error is: %s", executionArn, err)
	}
	if out.Status.Values() == nil {
		return &sfn.DescribeExecutionOutput{}, fmt.Errorf("execution status for step function '%v' not fount", out.Name)
	}
	return out, nil
}
