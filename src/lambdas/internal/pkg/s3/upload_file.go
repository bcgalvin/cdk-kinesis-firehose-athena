package s3

import (
	"context"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/rs/zerolog/log"
)

func (c *Client) UploadFile(bucketName, key, filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()
	uploader := manager.NewUploader(c.s3)
	log.Debug().Msgf("Uploading object '%s' in bucket '%s'\n", key, bucketName)
	_, err = uploader.Upload(context.Background(), &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
		Body:   file,
	})
	return nil
}
