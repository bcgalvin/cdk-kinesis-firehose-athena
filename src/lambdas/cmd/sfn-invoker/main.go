package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/cfn"
	"github.com/aws/aws-sdk-go-v2/aws"
	log "github.com/sirupsen/logrus"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	stepFn "github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/sfn"
)

type StepFunctionInput struct {
	TaskId    string `json:"taskId"`
	Timestamp int64  `json:"timestamp"`
}

func HandleRequest(ctx context.Context, event cfn.Event) (stepFn.Result, error) {
	var taskId string
	var found bool
	taskId, found = event.ResourceProperties["taskId"].(string)
	if !found {
		log.Printf("taskId not found in event: %+v\n, using default value: %s\n", event, "invoke-sfn")
		taskId = "invoke-sfn"
	}
	log.Printf("Task ID: %s", taskId)

	stateMachineArn := os.Getenv("StateMachineArn")
	log.Printf("State Machine Arm: %s", stateMachineArn)

	unixTime := time.Now().Unix()

	initialState := &StepFunctionInput{
		TaskId:    taskId,
		Timestamp: unixTime,
	}

	initialStateAsBytes, _ := json.Marshal(initialState)
	initialStateAsString := string(initialStateAsBytes)
	log.Printf("This is initial state %s\n", initialStateAsString)

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		panic("unable to load SDK config, " + err.Error())
	}

	client := sfn.NewFromConfig(cfg)

	stateMachineExcutionName := fmt.Sprintf("%s-%v", taskId, unixTime)
	input := &sfn.StartExecutionInput{
		StateMachineArn: &stateMachineArn,
		Input:           &initialStateAsString,
		Name:            &stateMachineExcutionName,
	}

	result, err := client.StartExecution(ctx, input)
	if err != nil {
		log.Printf("StartExecution error: %v\n", err)
		return stepFn.Result{
			Failure: &sfn.SendTaskFailureInput{
				Error: aws.String(stepFn.GetType(err)),
				Cause: aws.String(err.Error()),
			},
		}, err
	} else {
		log.Printf("Started step function executed: %v\n", result)
	}

	output := fmt.Sprintf("{\"\taskId\": \"%s\"", stateMachineExcutionName)

	return stepFn.Result{
		Success: &sfn.SendTaskSuccessInput{
			Output: aws.String(output),
		},
	}, nil
}

func main() {
	lambda.Start(HandleRequest)
}
