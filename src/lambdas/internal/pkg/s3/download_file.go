package s3

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	log "github.com/sirupsen/logrus"
)

func (c *Client) DownloadFile(bucketName, key, filePath string) error {
	f, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0774)
	if err != nil {
		return fmt.Errorf("unable to create file, %s", err)
	}
	defer f.Close()
	downloader := manager.NewDownloader(c.s3, func(d *manager.Downloader) {
		d.PartSize = 64 * 1024 * 1024
	})
	_, err = downloader.Download(context.TODO(), f, &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	log.Debugf("Downloading object '%s' in bucket '%s'\n", key, bucketName)
	if err != nil {
		return fmt.Errorf("unable to download file, %s", err)
	}
	return nil
}
