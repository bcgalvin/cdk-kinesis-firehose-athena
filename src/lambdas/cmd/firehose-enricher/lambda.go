package main

import (
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	log "github.com/sirupsen/logrus"
)

func handleRequest(evnt events.KinesisFirehoseEvent) (events.KinesisFirehoseResponse, error) {
	log.SetFormatter(&log.JSONFormatter{})

	var response events.KinesisFirehoseResponse
	for _, record := range evnt.Records {
		var e events.DynamoDBEventRecord
		var image map[string]events.DynamoDBAttributeValue

		err := json.Unmarshal(record.Data, &e)
		if err != nil {
			return events.KinesisFirehoseResponse{}, err
		}

		if len(e.Change.NewImage) > 0 {
			image = e.Change.NewImage
		} else if len(e.Change.OldImage) > 0 {
			image = e.Change.OldImage
		} else {
			return events.KinesisFirehoseResponse{}, fmt.Errorf("invalid DynamoDBEvent: %v", e)
		}

		partitionKeys, err := extractDateValues(image["createdAt"].String())
		if err != nil {
			return events.KinesisFirehoseResponse{}, err
		}

		tableData, err := createTableData(image)
		if err != nil {
			return events.KinesisFirehoseResponse{}, err
		}

		tableDataB, err := json.Marshal(tableData)
		if err != nil {
			return events.KinesisFirehoseResponse{}, err
		}
		log.Infof("Image: %v\n", tableData)
		response.Records = append(response.Records, events.KinesisFirehoseResponseRecord{
			RecordID: record.RecordID,
			Result:   "Ok",
			Data:     tableDataB,
			Metadata: events.KinesisFirehoseResponseRecordMetadata{
				PartitionKeys: partitionKeys,
			},
		})
	}
	return response, nil
}

func main() {
	lambda.Start(handleRequest)
}
