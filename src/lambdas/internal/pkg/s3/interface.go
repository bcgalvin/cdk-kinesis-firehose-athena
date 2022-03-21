package s3

import (
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
)

type Interface interface {
	UploadFile(bucketName, key, filePath string) error
	DownloadFile(bucketName, key, filePath string) error
}

type s3Interface interface {
	manager.UploadAPIClient
	manager.DownloadAPIClient
}
