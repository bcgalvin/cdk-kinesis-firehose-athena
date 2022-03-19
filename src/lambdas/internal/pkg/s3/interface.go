package s3

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Interface interface {
	BucketExists(string) (bool, error)
	UploadFile(bucketName, key, filePath string) error
	DownloadFile(bucketName, key, filePath string) error
	ListObjects(bucketName string) ([]string, error)
	EmptyBucket(bucketName string) error
	DeleteObject(bucketName, key string) error
	DeleteObjectVersion(bucketName, key, versionId string) error
}

type s3Interface interface {
	s3.HeadBucketAPIClient
	s3.HeadObjectAPIClient
	s3.ListObjectsV2APIClient
	manager.UploadAPIClient
	manager.DownloadAPIClient
	DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
	ListObjectVersions(ctx context.Context, params *s3.ListObjectVersionsInput, optFns ...func(*s3.Options)) (*s3.ListObjectVersionsOutput, error)
}
