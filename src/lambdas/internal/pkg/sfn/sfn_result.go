package sfn

import "github.com/aws/aws-sdk-go-v2/service/sfn"

type Result struct {
	Success *sfn.SendTaskSuccessInput
	Failure *sfn.SendTaskFailureInput
}
