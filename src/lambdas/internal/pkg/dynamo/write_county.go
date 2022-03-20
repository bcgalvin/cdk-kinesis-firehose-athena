package dynamo

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"golang.org/x/sync/errgroup"
	"time"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type County struct {
	CensusId        string `dynamodbav:"census_id"`
	State           string `dynamodbav:"state"`
	County          string `dynamodbav:"county"`
	TotalPop        string `dynamodbav:"total_pop"`
	Men             string `dynamodbav:"county"`
	Women           string `dynamodbav:"women"`
	Hispanic        string `dynamodbav:"hispanic"`
	White           string `dynamodbav:"white"`
	Black           string `dynamodbav:"black"`
	Native          string `dynamodbav:"native"`
	Asian           string `dynamodbav:"asian"`
	Pacific         string `dynamodbav:"pacific"`
	Citizen         string `dynamodbav:"citizen"`
	Income          string `dynamodbav:"income"`
	IncomeErr       string `dynamodbav:"incomeErr"`
	IncomePerCap    string `dynamodbav:"incomePerCap"`
	IncomePerCapErr string `dynamodbav:"incomePerCapErr"`
	Poverty         string `dynamodbav:"poverty"`
	ChildPoverty    string `dynamodbav:"childPoverty"`
	Professional    string `dynamodbav:"professional"`
	Service         string `dynamodbav:"service"`
	Office          string `dynamodbav:"office"`
	Construction    string `dynamodbav:"construction"`
	Production      string `dynamodbav:"production"`
	Drive           string `dynamodbav:"drive"`
	Carpool         string `dynamodbav:"carpool"`
	Transit         string `dynamodbav:"transit"`
	Walk            string `dynamodbav:"walk"`
	OtherTransp     string `dynamodbav:"otherTransp"`
	WorkAtHome      string `dynamodbav:"workAtHome"`
	MeanCommute     string `dynamodbav:"meanCommute"`
	Employed        string `dynamodbav:"employed"`
	PrivateWork     string `dynamodbav:"privateWork"`
	PublicWork      string `dynamodbav:"publicWork"`
	SelfEmployed    string `dynamodbav:"selfEmployed"`
	FamilyWork      string `dynamodbav:"familyWork"`
	Unemployment    string `dynamodbav:"unemployment"`
}

type DynamoDBCountyItem struct {
	PK string `dynamodbav:"PK" json:"PK,omitempty"`
	SK string `dynamodbav:"SK"`
	County
	CreatedAt time.Time `dynamodbav:"createdAt"`
}

func (c *Client) WriteCounties(ctx context.Context, counties []*County, tableName string) error {
	g, _ := errgroup.WithContext(ctx)

	for _, chunk := range chunkBy(counties, 25) {
		localInputs := chunk

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

func CreateCountyItem(county *County) (DynamoDBCountyItem, error) {
	ddbItem := DynamoDBCountyItem{
		PK:        renderPartitionKey(county.State),
		SK:        renderSortKey(county.County),
		County:    *county,
		CreatedAt: randate(),
	}

	return ddbItem, nil
}
