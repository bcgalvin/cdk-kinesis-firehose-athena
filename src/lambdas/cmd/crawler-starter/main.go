package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/aws/aws-lambda-go/cfn"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/glue"
	log "github.com/sirupsen/logrus"
)

func handleRequest(ctx context.Context, evnt cfn.Event) (physicalResourceID string, data map[string]interface{}, err error) {

	if evnt.RequestType == cfn.RequestDelete {
		log.Infof("Delete event type, skipping")
		return
	}

	log.Infof("Retrieving trigger name")

	triggerName, found := evnt.ResourceProperties["TriggerName"].(string)
	if !found {
		return physicalResourceID, data, errors.New("TriggerName is required")
	}

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
		return physicalResourceID, data, fmt.Errorf("failed to activate the trigger: %w", err)
	}

	log.Infof("Trigger %s activated", triggerName)

	return
}

func main() {
	lambda.Start(cfn.LambdaWrap(handleRequest))
}
