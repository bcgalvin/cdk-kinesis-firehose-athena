package s3

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func (c *Client) DeleteObject(bucketName, key string) error {
	_, err := c.s3.DeleteObject(context.Background(), &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		return err
	}

	return nil
}

func (c *Client) DeleteObjectVersion(bucketName, key, versionId string) error {
	_, err := c.s3.DeleteObject(context.Background(), &s3.DeleteObjectInput{
		Bucket:    aws.String(bucketName),
		Key:       aws.String(key),
		VersionId: aws.String(versionId),
	})

	if err != nil {
		return err
	}

	return nil
}
