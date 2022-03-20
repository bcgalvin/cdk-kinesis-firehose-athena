package dynamo

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"golang.org/x/sync/errgroup"
)

const (
	PK = "PK"
	SK = "SK"
)

func (c *Client) DeleteAllCounties(ctx context.Context, tableName string) error {
	g, _ := errgroup.WithContext(ctx)
	p := dynamodb.NewScanPaginator(c.ddb, &dynamodb.ScanInput{
		TableName: aws.String(tableName),
	})

	var pkeys []string
	var skeys []string
	for p.HasMorePages() {
		out, err := p.NextPage(context.Background())
		if err != nil {
			return err
		}
		for _, item := range out.Items {
			pk := item[PK]
			sk := item[SK]
			if v, ok := pk.(*types.AttributeValueMemberS); ok {
				pkeys = append(pkeys, v.Value)
			}
			if v, ok := sk.(*types.AttributeValueMemberS); ok {
				skeys = append(skeys, v.Value)
			}
		}
	}

	keys, _ := zipKeys(pkeys, skeys)

	for _, chunk := range chunkKeys(keys, 25) {
		localInputs := chunk

		g.Go(func() error {
			for _, k := range localInputs {
				input := &dynamodb.BatchWriteItemInput{
					RequestItems: make(map[string][]types.WriteRequest),
				}
				var wrs []types.WriteRequest

				wr := types.WriteRequest{
					DeleteRequest: &types.DeleteRequest{
						Key: map[string]types.AttributeValue{
							"PK": &types.AttributeValueMemberS{Value: k.PK},
							"SK": &types.AttributeValueMemberS{Value: k.SK},
						},
					},
				}
				wrs = append(wrs, wr)

				input.RequestItems[tableName] = wrs
				_, err := c.ddb.BatchWriteItem(ctx, input)
				if err != nil {
					return err
				}

			}
			return nil
		})

	}
	return g.Wait()
}
