package sfn

import (
	"github.com/stretchr/testify/mock"
)

type SfnMock struct {
	sfnInterface
	mock.Mock
}

func NewMockClient() Client {
	return Client{
		sfn: new(SfnMock),
	}
}
