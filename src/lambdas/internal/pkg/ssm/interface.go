package ssm

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

type ssmInterface interface {
	GetParameter(context.Context, *ssm.GetParameterInput, ...func(options *ssm.Options)) (*ssm.GetParameterOutput, error)
}
