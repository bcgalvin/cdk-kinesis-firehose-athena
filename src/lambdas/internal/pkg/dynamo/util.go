package dynamo

import (
	"fmt"
	"math/rand"
	"time"
)

type stringTuple struct {
	PK string
	SK string
}

func renderPartitionKey(state string) string {
	return fmt.Sprintf("STATE#%s", state)
}

func renderSortKey(county string) string {
	return fmt.Sprintf("COUNTY#%s", county)
}

func zipKeys(a []string, b []string) ([]stringTuple, error) {
	if len(a) != len(b) {
		return nil, fmt.Errorf("zip: arguments length must be same ")
	}

	var keys []stringTuple
	for index, value := range a {
		keys = append(keys, stringTuple{value, b[index]})
	}
	return keys, nil
}

func chunkBy(items []*County, size int) (chunks [][]*County) {
	for size < len(items) {
		items, chunks = items[size:], append(chunks, items[0:size:size])
	}

	return append(chunks, items)
}

func chunkKeys(items []stringTuple, size int) (chunks [][]stringTuple) {
	for size < len(items) {
		items, chunks = items[size:], append(chunks, items[0:size:size])
	}

	return append(chunks, items)
}

func randate() time.Time {
	min := time.Date(1970, 1, 0, 0, 0, 0, 0, time.UTC).Unix()
	max := time.Date(2070, 1, 0, 0, 0, 0, 0, time.UTC).Unix()
	delta := max - min

	sec := rand.Int63n(delta) + min
	return time.Unix(sec, 0)
}
