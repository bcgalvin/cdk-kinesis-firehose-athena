package main

import (
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"time"
)

type DynamoDBEventRecord struct {
	AWSRegion      string                       `json:"awsRegion"`
	Change         DynamoDBStreamRecord         `json:"dynamodb"`
	EventID        string                       `json:"eventID"`
	EventName      string                       `json:"eventName"`
	EventSource    string                       `json:"eventSource"`
	EventVersion   string                       `json:"eventVersion"`
	EventSourceArn string                       `json:"eventSourceARN"`
	UserIdentity   *events.DynamoDBUserIdentity `json:"userIdentity,omitempty"`
}

type DynamoDBStreamRecord struct {
	ApproximateCreationDateTime events.SecondsEpochTime `json:"ApproximateCreationDateTime,omitempty"`
	Keys                        Keys                    `json:"Keys,omitempty"`
	NewImage                    NewImage                `json:"NewImage,omitempty"`
	SizeBytes                   int64                   `json:"SizeBytes"`
	StreamViewType              string                  `json:"StreamViewType"`
}

type Keys struct {
	PK struct {
		S string `json:"S"`
	} `json:"PK"`
	SK struct {
		S string `json:"S"`
	} `json:"SK"`
}

type NewImage struct {
	PK struct {
		S string `json:"S"`
	} `json:"PK"`
	CreatedAt struct {
		S string `json:"S"`
	} `json:"createdAt"`
	SK struct {
		S string `json:"S"`
	} `json:"SK"`
}

func extractDateValues(date string) (string, string, string, error) {
	dateParsed, err := time.Parse("2006-01-02", date)
	if err != nil {
		fmt.Println(err)
		return "", "", "", err
	}
	y, m, d := dateParsed.Date()
	year := fmt.Sprintf("%0*d", 4, int(y))
	month := fmt.Sprintf("%0*d", 2, m)
	day := fmt.Sprintf("%0*d", 2, d)
	return year, month, day, nil

}

func handleRequest(evnt events.KinesisFirehoseEvent) (events.KinesisFirehoseResponse, error) {

	fmt.Printf("InvocationID: %s\n", evnt.InvocationID)
	fmt.Printf("DeliveryStreamArn: %s\n", evnt.DeliveryStreamArn)
	fmt.Printf("Region: %s\n", evnt.Region)

	var response events.KinesisFirehoseResponse

	for _, record := range evnt.Records {
		fmt.Printf("RecordID: %s\n", record.RecordID)
		fmt.Printf("ApproximateArrivalTimestamp: %s\n", record.ApproximateArrivalTimestamp)

		var recordData DynamoDBEventRecord
		err := json.Unmarshal(record.Data, &recordData)
		if err != nil {
			return events.KinesisFirehoseResponse{}, err
		}
		fmt.Printf("Dynamodb NewImage: %v\n", recordData.Change.NewImage)

		var transformedRecord events.KinesisFirehoseResponseRecord
		transformedRecord.RecordID = record.RecordID
		transformedRecord.Result = events.KinesisFirehoseTransformedStateOk
		transformedRecord.Data = record.Data

		var metaData events.KinesisFirehoseResponseRecordMetadata
		partitionKeys := make(map[string]string)
		y, m, d, err := extractDateValues(recordData.Change.NewImage.CreatedAt.S)
		if err != nil {
			return events.KinesisFirehoseResponse{}, err
		}
		partitionKeys["year"] = y
		partitionKeys["month"] = m
		partitionKeys["day"] = d

		err = json.Unmarshal(record.Data, &recordData)
		if err != nil {
			return events.KinesisFirehoseResponse{}, err
		}

		metaData.PartitionKeys = partitionKeys
		transformedRecord.Metadata = metaData

		response.Records = append(response.Records, transformedRecord)
	}

	return response, nil
}

func main() {
	lambda.Start(handleRequest)
}
