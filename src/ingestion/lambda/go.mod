module github.com/bcgalvin/cdk-kinesis-firehose-enricher

go 1.17

require (
	github.com/aws/aws-lambda-go v1.28.0
	github.com/aws/aws-sdk-go-v2/service/dynamodbstreams v1.13.0
	github.com/google/go-cmp v0.5.7
	github.com/sirupsen/logrus v1.8.1
)

require (
	github.com/aws/smithy-go v1.11.1 // indirect
	github.com/stretchr/testify v1.7.0 // indirect
	golang.org/x/sys v0.0.0-20210816074244-15123e1e1f71 // indirect
)
