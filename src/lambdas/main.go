package main

import (
	"fmt"
	"github.com/bcgalvin/cdk-kinesis-firehose-athena/src/lambdas/internal/pkg/ssm"
)

func main() {

	s3BucketParam := ssm.GetParameter("/test/raw-bucket")
	ssmClient := ssm.NewClient()
	s3BucketName := ssmClient.GetParameter(s3BucketParam)
	fmt.Println(s3BucketName)

}
