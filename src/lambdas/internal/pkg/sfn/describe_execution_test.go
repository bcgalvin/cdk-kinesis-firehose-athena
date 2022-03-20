package sfn

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"testing"

	"github.com/stretchr/testify/assert"
)

var (
	testExecutionArn = "arn:aws:states:us-west-2:123456789012:execution:testSfn:testExecution"
)

func (m *SfnMock) DescribeExecution(ctx context.Context, input *sfn.DescribeExecutionInput, opts ...func(options *sfn.Options)) (*sfn.DescribeExecutionOutput, error) {
	args := m.Called(ctx, input)
	output := args.Get(0)
	err := args.Error(1)

	if output != nil {
		return output.(*sfn.DescribeExecutionOutput), err
	}
	return nil, err
}

func TestClient_DescribeExecution(t *testing.T) {
	client := NewMockClient()
	describeExecutionOutput := &sfn.DescribeExecutionOutput{ExecutionArn: &testExecutionArn}

	client.sfn.(*SfnMock).On("DescribeExecution", context.Background(),
		&sfn.DescribeExecutionInput{ExecutionArn: &testExecutionArn}).
		Return(describeExecutionOutput, nil)
	execution, err := client.DescribeExecution(testExecutionArn)
	descExecOutput := sfn.DescribeExecutionOutput{
		ExecutionArn: &testExecutionArn,
	}
	assert.NoError(t, err)
	assert.Equal(t, &descExecOutput.ExecutionArn, &execution.ExecutionArn)
	client.sfn.(*SfnMock).AssertExpectations(t)
}
