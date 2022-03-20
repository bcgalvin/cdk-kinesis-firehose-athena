package main

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"os"
	"reflect"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/glue"
	log "github.com/sirupsen/logrus"
)

type Result struct {
	Success *sfn.SendTaskSuccessInput
	Failure *sfn.SendTaskFailureInput
}

func getType(myvar interface{}) string {
	t := reflect.TypeOf(myvar)
	if t.Kind() == reflect.Ptr {
		return t.Elem().Name()
	}
	return t.Name()
}

func handleRequest(ctx context.Context) (Result, error) {

	log.Infof("Retrieving trigger name")
	triggerName := os.Getenv("GLUE_TRIGGER_NAME")
	log.Infof("trigger: %s found", triggerName)
	log.Infof("Initializing the client")

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		panic(err)
	}

	glueClient := glue.NewFromConfig(cfg)

	log.Infof("Activating the trigger: %s", triggerName)

	_, err = glueClient.StartTrigger(ctx, &glue.StartTriggerInput{
		Name: aws.String(triggerName),
	})
	if err != nil {
		return Result{
			Failure: &sfn.SendTaskFailureInput{
				Error: aws.String(getType(err)),
				Cause: aws.String(err.Error()),
			},
		}, err
	}

	log.Infof("Trigger %s activated", triggerName)

	return Result{
		Success: &sfn.SendTaskSuccessInput{
			Output: aws.String("Success"),
		},
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}
