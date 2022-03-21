package dynamo

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/bcgalvin/cdk-kinesis-firehose-athena/internal/pkg/domain"
	log "github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
)

func (c *Client) WriteCounties(ctx context.Context, counties []*domain.County, tableName string) error {
	g, _ := errgroup.WithContext(ctx)

	for _, chunk := range chunkBy(counties, 25) {
		localInputs := chunk
		log.Infof("Writing %d counties to dynamodb", len(localInputs))

		g.Go(func() error {
			writes := make([]types.WriteRequest, len(localInputs))

			for index, input := range localInputs {
				item, err := CreateCountyItem(input)

				if err != nil {
					return err
				}
				attributeValues, err := attributevalue.MarshalMap(item)
				write := types.WriteRequest{
					PutRequest: &types.PutRequest{
						Item: attributeValues,
					},
				}
				writes[index] = write
			}

			_, err := c.ddb.BatchWriteItem(ctx, &dynamodb.BatchWriteItemInput{
				RequestItems: map[string][]types.WriteRequest{
					tableName: writes,
				},
			})
			if err != nil {
				return err
			}
			return nil
		})
	}

	return g.Wait()
}

func CreateCountyItem(county *domain.County) (domain.DBCountyItem, error) {
	ddbItem := domain.DBCountyItem{
		PK:        renderPartitionKey(county.State),
		SK:        renderSortKey(county.County),
		County:    *county,
		CreatedAt: randate(),
	}

	return ddbItem, nil
}
