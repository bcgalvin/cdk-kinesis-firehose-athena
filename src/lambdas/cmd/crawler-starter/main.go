package main

import (
	"context"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/glue"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	stepFn "github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/sfn"
	log "github.com/sirupsen/logrus"
	"os"
)

func handleRequest(ctx context.Context) (stepFn.Result, error) {

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
		return stepFn.Result{
			Failure: &sfn.SendTaskFailureInput{
				Error: aws.String(stepFn.GetType(err)),
				Cause: aws.String(err.Error()),
			},
		}, err
	}

	log.Infof("Trigger %s activated", triggerName)

	return stepFn.Result{
		Success: &sfn.SendTaskSuccessInput{
			Output: aws.String("Success"),
		},
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}
