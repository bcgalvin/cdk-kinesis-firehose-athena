package domain

import "time"

type County struct {
	CensusId        string `dynamodbav:"censusId" json:"censusId"`
	State           string `dynamodbav:"state" json:"state"`
	County          string `dynamodbav:"county" json:"county"`
	TotalPop        string `dynamodbav:"totalPop" json:"totalPop"`
	Men             string `dynamodbav:"men" json:"men"`
	Women           string `dynamodbav:"women" json:"women"`
	Hispanic        string `dynamodbav:"hispanic" json:"hispanic"`
	White           string `dynamodbav:"white" json:"white"`
	Black           string `dynamodbav:"black" json:"black"`
	Native          string `dynamodbav:"native" json:"native"`
	Asian           string `dynamodbav:"asian" json:"asian"`
	Pacific         string `dynamodbav:"pacific" json:"pacific"`
	Citizen         string `dynamodbav:"citizen" json:"citizen"`
	Income          string `dynamodbav:"income" json:"income"`
	IncomeErr       string `dynamodbav:"incomeErr" json:"incomeErr"`
	IncomePerCap    string `dynamodbav:"incomePerCap" json:"incomePerCap"`
	IncomePerCapErr string `dynamodbav:"incomePerCapErr" json:"incomePerCapErr"`
	Poverty         string `dynamodbav:"poverty" json:"poverty"`
	ChildPoverty    string `dynamodbav:"childPoverty" json:"childPoverty"`
	Professional    string `dynamodbav:"professional" json:"professional"`
	Service         string `dynamodbav:"service" json:"service"`
	Office          string `dynamodbav:"office" json:"office"`
	Construction    string `dynamodbav:"construction" json:"construction"`
	Production      string `dynamodbav:"production" json:"production"`
	Drive           string `dynamodbav:"drive" json:"drive"`
	Carpool         string `dynamodbav:"carpool" json:"carpool"`
	Transit         string `dynamodbav:"transit" json:"transit"`
	Walk            string `dynamodbav:"walk" json:"walk"`
	OtherTransp     string `dynamodbav:"otherTransp" json:"otherTransp"`
	WorkAtHome      string `dynamodbav:"workAtHome" json:"workAtHome"`
	MeanCommute     string `dynamodbav:"meanCommute" json:"meanCommute"`
	Employed        string `dynamodbav:"employed" json:"employed"`
	PrivateWork     string `dynamodbav:"privateWork" json:"privateWork"`
	PublicWork      string `dynamodbav:"publicWork" json:"publicWork"`
	SelfEmployed    string `dynamodbav:"selfEmployed" json:"selfEmployed"`
	FamilyWork      string `dynamodbav:"familyWork" json:"familyWork"`
	Unemployment    string `dynamodbav:"unemployment" json:"unemployment"`
}

type DBCountyItem struct {
	PK string `dynamodbav:"PK" json:"PK"`
	SK string `dynamodbav:"SK" json:"SK"`
	County
	CreatedAt time.Time `dynamodbav:"createdAt" json:"createdAt"`
}
