package ssm

import (
	"context"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

func (c *Client) GetParameter(p string) (string, error) {
	parameterName := p
	input := &ssm.GetParameterInput{
		Name: aws.String(parameterName),
	}
	output, err := c.ssm.GetParameter(context.Background(), input)
	if err != nil {
		return "", fmt.Errorf("unable to obtain bucket output name. The SSM parameter %s may be misconfigured. Error is: %s", parameterName, err)
	}
	if output.Parameter.Value == nil {
		return "", fmt.Errorf("parameter '%s' is not set", parameterName)
	}
	return aws.ToString(output.Parameter.Value), nil
}
