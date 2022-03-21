package sfn

import (
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"reflect"
)

type Result struct {
	Success *sfn.SendTaskSuccessInput
	Failure *sfn.SendTaskFailureInput
}

func GetType(getVar interface{}) string {
	t := reflect.TypeOf(getVar)
	if t.Kind() == reflect.Ptr {
		return t.Elem().Name()
	}
	return t.Name()
}
