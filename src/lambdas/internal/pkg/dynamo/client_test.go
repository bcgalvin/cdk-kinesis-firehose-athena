package dynamo

import (
	"github.com/stretchr/testify/mock"
)

type DynamoMock struct {
	ddbInterface
	mock.Mock
}

func NewMockClient() Client {
	return Client{
		ddb: new(DynamoMock),
	}
}
