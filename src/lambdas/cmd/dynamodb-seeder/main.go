package main

import (
	"context"
	"encoding/csv"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/dynamo"
	"github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/s3"
	log "github.com/sirupsen/logrus"
	"os"
)

func handleRequest(evnt events.KinesisFirehoseEvent) error {
	log.SetFormatter(&log.JSONFormatter{})
	s3BucketName := os.Getenv("S3_BUCKET")
	ddbTableName := os.Getenv("DDB_TABLE")
	ctx := context.TODO()
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Fatal(err)
	}

	s3Client := s3.New(cfg)
	ddbClient := dynamo.New(cfg)

	s3Client.DownloadFile(s3BucketName, "data/counties.csv", "/tmp/counties.csv")
	f, err := os.Open("/tmp/counties.csv")
	if err != nil {
		log.Fatal(err)
	}

	defer f.Close()

	records, err := readData("counties.csv")
	var counties []*dynamo.County

	for _, record := range records {

		county := dynamo.County{
			record[0],
			record[1],
			record[2],
			record[3],
			record[4],
			record[5],
			record[6],
			record[7],
			record[8],
			record[9],
			record[10],
			record[11],
			record[12],
			record[13],
			record[14],
			record[15],
			record[16],
			record[17],
			record[18],
			record[19],
			record[20],
			record[21],
			record[22],
			record[23],
			record[24],
			record[25],
			record[26],
			record[27],
			record[28],
			record[29],
			record[30],
			record[31],
			record[32],
			record[33],
			record[34],
			record[35],
			record[36],
		}
		counties = append(counties, &county)
		//countiesPtr = &counties

	}

	err = ddbClient.WriteCounties(ctx, counties, ddbTableName)
	if err != nil {
		log.Fatal(err)
	}
	return nil
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
