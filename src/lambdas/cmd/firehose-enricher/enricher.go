package main

import (
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"reflect"
	"strconv"
	"time"
)

func extractDateValues(date string) (map[string]string, error) {
	partitionKeys := make(map[string]string)
	dateParsed, err := time.Parse(time.RFC3339, date)
	if err != nil {
		fmt.Println(err)
		return map[string]string{}, err
	}
	y, m, d := dateParsed.Date()
	year := fmt.Sprintf("%0*d", 4, y)
	month := fmt.Sprintf("%0*d", 2, m)
	day := fmt.Sprintf("%0*d", 2, d)
	partitionKeys["year"] = year
	partitionKeys["month"] = month
	partitionKeys["day"] = day
	return partitionKeys, nil
}

func createTableData(r map[string]events.DynamoDBAttributeValue) (map[string]interface{}, error) {
	var keysToDelete []string
	for k := range r {
		k := k
		if k == "CreatedAt" {
			keysToDelete = append(keysToDelete, k)
		}
	}
	for i := 0; i < len(keysToDelete); i++ {
		delete(r, keysToDelete[i])
	}
	m, err := stripDynamoDBTypesFromMap(r)
	if err != nil {
		return nil, err
	}

	return m, nil
}

func getAttributeValue(av events.DynamoDBAttributeValue) (interface{}, error) {
	switch av.DataType() {
	case events.DataTypeBinary:
		return av.Binary(), nil
	case events.DataTypeBoolean:
		return av.Boolean(), nil
	case events.DataTypeBinarySet:
		return av.BinarySet(), nil
	case events.DataTypeList:
		return stripDynamoDBTypesFromList(av.List())
	case events.DataTypeMap:
		return stripDynamoDBTypesFromMap(av.Map())
	case events.DataTypeNumber:
		return getNumber(av.Number())
	case events.DataTypeNumberSet:
		return av.NumberSet(), nil
	case events.DataTypeNull:
		return nil, nil
	case events.DataTypeString:
		return av.String(), nil
	case events.DataTypeStringSet:
		return av.StringSet(), nil
	}
	return nil, fmt.Errorf("unknown DynamoDBAttributeValue type: %v", reflect.TypeOf(av.DataType()))
}

func stripDynamoDBTypesFromList(list []events.DynamoDBAttributeValue) (op []interface{}, err error) {
	op = make([]interface{}, len(list))
	for i := 0; i < len(list); i++ {
		op[i], err = getAttributeValue(list[i])
		if err != nil {
			return
		}
	}
	return
}

func getNumber(s string) (interface{}, error) {
	// First try integer.
	i, err := strconv.ParseInt(s, 10, 64)
	if err == nil {
		return i, err
	}
	// Then float.
	f, err := strconv.ParseFloat(s, 64)
	if err == nil {
		return f, err
	}
	return nil, fmt.Errorf("cannot parse %q as int64 or float64", s)
}

func stripDynamoDBTypesFromMap(m map[string]events.DynamoDBAttributeValue) (op map[string]interface{}, err error) {
	op = make(map[string]interface{})
	for k := range m {
		k := k
		op[k], err = getAttributeValue(m[k])
		if err != nil {
			return
		}
	}
	return
}
