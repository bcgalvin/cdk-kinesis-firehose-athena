package main

import (
	"context"
	"encoding/csv"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/domain"
	"github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/dynamo"
	"github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/s3"
	stepFn "github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/sfn"
	log "github.com/sirupsen/logrus"
	"os"
)

func handleRequest(ctx context.Context) (stepFn.Result, error) {
	log.SetFormatter(&log.JSONFormatter{})
	s3BucketName := os.Getenv("S3_BUCKET")
	ddbTableName := os.Getenv("DDB_TABLE")
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return stepFn.Result{
			Failure: &sfn.SendTaskFailureInput{
				Error: aws.String(stepFn.GetType(err)),
				Cause: aws.String(err.Error()),
			},
		}, err
	}

	s3Client := s3.New(cfg)
	ddbClient := dynamo.New(cfg)

	err = s3Client.DownloadFile(s3BucketName, "data/counties.csv", "/tmp/counties.csv")
	if err != nil {
		return stepFn.Result{
			Failure: &sfn.SendTaskFailureInput{
				Error: aws.String(stepFn.GetType(err)),
				Cause: aws.String(err.Error()),
			},
		}, err
	}
	f, err := os.Open("/tmp/counties.csv")
	if err != nil {
		return stepFn.Result{
			Failure: &sfn.SendTaskFailureInput{
				Error: aws.String(stepFn.GetType(err)),
				Cause: aws.String(err.Error()),
			},
		}, err
	}

	defer f.Close()

	records, err := readData("/tmp/counties.csv")
	log.Printf("records: %+v\n", records)
	var counties []*domain.County

	for _, record := range records {

		county := domain.County{
			CensusId:        record[0],
			State:           record[1],
			County:          record[2],
			TotalPop:        record[3],
			Men:             record[4],
			Women:           record[5],
			Hispanic:        record[6],
			White:           record[7],
			Black:           record[8],
			Native:          record[9],
			Asian:           record[10],
			Pacific:         record[11],
			Citizen:         record[12],
			Income:          record[13],
			IncomeErr:       record[14],
			IncomePerCap:    record[15],
			IncomePerCapErr: record[16],
			Poverty:         record[17],
			ChildPoverty:    record[18],
			Professional:    record[19],
			Service:         record[20],
			Office:          record[21],
			Construction:    record[22],
			Production:      record[23],
			Drive:           record[24],
			Carpool:         record[25],
			Transit:         record[26],
			Walk:            record[27],
			OtherTransp:     record[28],
			WorkAtHome:      record[29],
			MeanCommute:     record[30],
			Employed:        record[31],
			PrivateWork:     record[32],
			PublicWork:      record[33],
			SelfEmployed:    record[34],
			FamilyWork:      record[35],
			Unemployment:    record[36],
		}
		counties = append(counties, &county)
	}
	log.Printf("counties: %+v\n", counties)

	err = ddbClient.WriteCounties(ctx, counties, ddbTableName)
	if err != nil {
		return stepFn.Result{
			Failure: &sfn.SendTaskFailureInput{
				Error: aws.String(stepFn.GetType(err)),
				Cause: aws.String(err.Error()),
			},
		}, err
	}
	return stepFn.Result{
		Success: &sfn.SendTaskSuccessInput{
			Output: aws.String("Success"),
		},
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}

func readData(fileName string) ([][]string, error) {

	f, err := os.Open(fileName)

	if err != nil {
		return [][]string{}, err
	}

	defer f.Close()

	r := csv.NewReader(f)

	// skip first line
	if _, err := r.Read(); err != nil {
		return [][]string{}, err
	}

	records, err := r.ReadAll()

	if err != nil {
		return [][]string{}, err
	}

	return records, nil
}
