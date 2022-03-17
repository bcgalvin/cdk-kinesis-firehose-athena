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
	CensusId struct {
		S string `json:"S"`
	} `json:"CensusId"`
	State struct {
		S string `json:"S"`
	} `json:"State"`
	County struct {
		S string `json:"S"`
	} `json:"County"`
	TotalPop struct {
		S string `json:"S"`
	} `json:"TotalPop"`
	Men struct {
		S string `json:"S"`
	} `json:"Men"`
	Women struct {
		S string `json:"S"`
	} `json:"Women"`
	Hispanic struct {
		S string `json:"S"`
	} `json:"Hispanic"`
	White struct {
		S string `json:"S"`
	} `json:"White"`
	Black struct {
		S string `json:"S"`
	} `json:"Black"`
	Native struct {
		S string `json:"S"`
	} `json:"Native"`
	Asian struct {
		S string `json:"S"`
	} `json:"Asian"`
	Pacific struct {
		S string `json:"S"`
	} `json:"Pacific"`
	Citizen struct {
		S string `json:"S"`
	} `json:"Citizen"`
	Income struct {
		S string `json:"S"`
	} `json:"Income"`
	IncomeErr struct {
		S string `json:"S"`
	} `json:"IncomeErr"`
	IncomePerCap struct {
		S string `json:"S"`
	} `json:"IncomePerCap"`
	IncomePerCapErr struct {
		S string `json:"S"`
	} `json:"IncomePerCapErr"`
	Poverty struct {
		S string `json:"S"`
	} `json:"Poverty"`
	ChildPoverty struct {
		S string `json:"S"`
	} `json:"ChildPoverty"`
	Professional struct {
		S string `json:"S"`
	} `json:"Professional"`
	Service struct {
		S string `json:"S"`
	} `json:"Service"`
	Office struct {
		S string `json:"S"`
	} `json:"Office"`
	Construction struct {
		S string `json:"S"`
	} `json:"Construction"`
	Production struct {
		S string `json:"S"`
	} `json:"Production"`
	Drive struct {
		S string `json:"S"`
	} `json:"Drive"`
	Carpool struct {
		S string `json:"S"`
	} `json:"Carpool"`
	Transit struct {
		S string `json:"S"`
	} `json:"Transit"`
	Walk struct {
		S string `json:"S"`
	} `json:"Walk"`
	OtherTransp struct {
		S string `json:"S"`
	} `json:"OtherTransp"`
	WorkAtHome struct {
		S string `json:"S"`
	} `json:"WorkAtHome"`
	MeanCommute struct {
		S string `json:"S"`
	} `json:"MeanCommute"`
	Employed struct {
		S string `json:"S"`
	} `json:"Employed"`
	PrivateWork struct {
		S string `json:"S"`
	} `json:"PrivateWork"`
	PublicWork struct {
		S string `json:"S"`
	} `json:"PublicWork"`
	SelfEmployed struct {
		S string `json:"S"`
	} `json:"SelfEmployed"`
	FamilyWork struct {
		S string `json:"S"`
	} `json:"FamilyWork"`
	Unemployment struct {
		S string `json:"S"`
	} `json:"Unemployment"`
	CreatedAt struct {
		S string `json:"S"`
	} `json:"createdAt"`
}

type OutData struct {
	NewImage

	CensusId        string `json:"dynamodb.NewImage.CenusId.S"`
	State           string `json:"dynamodb.NewImage.State.S"`
	County          string `json:"dynamodb.NewImage.County.S"`
	TotalPop        string `json:"dynamodb.NewImage.TotalPop.S"`
	Men             string `json:"dynamodb.NewImage.Men.S"`
	Women           string `json:"dynamodb.NewImage.Women.S"`
	Hispanic        string `json:"dynamodb.NewImage.Hispanic.S"`
	White           string `json:"dynamodb.NewImage.White.S"`
	Black           string `json:"dynamodb.NewImage.Black.S"`
	Native          string `json:"dynamodb.NewImage.Native.S"`
	Asian           string `json:"dynamodb.NewImage.Asian.S"`
	Pacific         string `json:"dynamodb.NewImage.Pacific.S"`
	Citizen         string `json:"dynamodb.NewImage.Citizen.S"`
	Income          string `json:"dynamodb.NewImage.Income.S"`
	IncomeErr       string `json:"dynamodb.NewImage.IncomeErr.S"`
	IncomePerCap    string `json:"dynamodb.NewImage.IncomePerCap.S"`
	IncomePerCapErr string `json:"dynamodb.NewImage.IncomePerCapErr.S"`
	Poverty         string `json:"dynamodb.NewImage.Poverty.S"`
	ChildPoverty    string `json:"dynamodb.NewImage.ChildPoverty.S"`
	Professional    string `json:"dynamodb.NewImage.Professional.S"`
	Service         string `json:"dynamodb.NewImage.Service.S"`
	Office          string `json:"dynamodb.NewImage.Office.S"`
	Construction    string `json:"dynamodb.NewImage.Construction.S"`
	Production      string `json:"dynamodb.NewImage.Production.S"`
	Drive           string `json:"dynamodb.NewImage.Drive.S"`
	Carpool         string `json:"dynamodb.NewImage.Carpool.S"`
	Transit         string `json:"dynamodb.NewImage.Transit.S"`
	Walk            string `json:"dynamodb.NewImage.Walk.S"`
	OtherTransp     string `json:"dynamodb.NewImage.OtherTransp.S"`
	WorkAtHome      string `json:"dynamodb.NewImage.WorkAtHome.S"`
	MeanCommute     string `json:"dynamodb.NewImage.MeanCommute.S"`
	Employed        string `json:"dynamodb.NewImage.Employed.S"`
	PrivateWork     string `json:"dynamodb.NewImage.PrivateWork.S"`
	PublicWork      string `json:"dynamodb.NewImage.PublicWork.S"`
	SelfEmployed    string `json:"dynamodb.NewImage.SelfEmployed.S"`
	FamilyWork      string `json:"dynamodb.NewImage.FFamilyWork.S"`
	Unemployment    string `json:"dynamodb.NewImage.Unemployment.S"`
}

func extractDateValues(date string) (string, string, string, error) {
	dateParsed, err := time.Parse("2006-01-02", date)
	if err != nil {
		fmt.Println(err)
		return "", "", "", err
	}
	y, m, d := dateParsed.Date()
	year := fmt.Sprintf("%0*d", 4, y)
	month := fmt.Sprintf("%0*d", 2, m)
	day := fmt.Sprintf("%0*d", 2, d)
	return year, month, day, nil

}

func handleRequest(evnt events.KinesisFirehoseEvent) (events.KinesisFirehoseResponse, error) {

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
		metaData.PartitionKeys = partitionKeys
		transformedRecord.Metadata = metaData

		outData := OutData{
			NewImage: recordData.Change.NewImage,
		}

		data, err := json.Marshal(outData)
		if err != nil {
			return events.KinesisFirehoseResponse{}, err
		}

		response.Records = append(response.Records, events.KinesisFirehoseResponseRecord{
			RecordID: record.RecordID,
			Result:   "Ok",
			Data:     data,
			Metadata: events.KinesisFirehoseResponseRecordMetadata{
				PartitionKeys: partitionKeys,
			}})
	}

	return response, nil
}

func main() {
	lambda.Start(handleRequest)
}
