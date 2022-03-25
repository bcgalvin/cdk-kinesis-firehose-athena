package ssm

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/aws/aws-sdk-go-v2/service/ssm/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

const (
	testParameterPrefix = "/test/parameter"
)

func TestClient_GetParameter_ExpectedValue(t *testing.T) {
	testBucketName := "my-test-bucket"
	mockSsm := new(ssmMockClient)
	client := &Client{mockSsm}
	ctx := context.Background()
	mockSsm.On("GetParameter", ctx, &ssm.GetParameterInput{Name: aws.String(testParameterPrefix)}).
		Return(&ssm.GetParameterOutput{Parameter: &types.Parameter{Value: aws.String(testBucketName)}}, nil)

	actual, err := client.GetParameter(testParameterPrefix)
	require.NoError(t, err)
	assert.Equal(t, testBucketName, actual)
}

func TestClient_GetParameter_Error(t *testing.T) {
	mockSsm := new(ssmMockClient)
	client := &Client{mockSsm}
	ctx := context.Background()
	mockSsm.On("GetParameter", ctx, mock.Anything).Return((*ssm.GetParameterOutput)(nil), errors.New(""))

	_, err := client.GetParameter(testParameterPrefix)
	assert.Error(t, err)
}

func TestClient_GetParameter_NoValue(t *testing.T) {
	mockSsm := new(ssmMockClient)
	client := &Client{mockSsm}
	ctx := context.Background()
	mockSsm.On("GetParameter", ctx, mock.Anything).
		Return(&ssm.GetParameterOutput{Parameter: &types.Parameter{Value: nil}}, nil)

	_, err := client.GetParameter(testParameterPrefix)
	assert.Error(t, err)
}
