module github.com/bcgalvin/cdk-kinesis-firehose/lambdas

        go 1.17

        require (
        github.com/aws/aws-lambda-go v1.28.0
        github.com/aws/aws-sdk-go-v2 v1.15.0
        github.com/aws/aws-sdk-go-v2/config v1.15.0
        github.com/aws/aws-sdk-go-v2/service/glue v1.22.0
        github.com/aws/aws-sdk-go-v2/service/ssm v1.22.0
        github.com/sirupsen/logrus v1.8.1
        github.com/stretchr/testify v1.6.1
        )

        require (
        github.com/aws/aws-sdk-go-v2/credentials v1.10.0 // indirect
        github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.12.0 // indirect
        github.com/aws/aws-sdk-go-v2/internal/configsources v1.1.6 // indirect
        github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.4.0 // indirect
        github.com/aws/aws-sdk-go-v2/internal/ini v1.3.7 // indirect
        github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.9.0 // indirect
        github.com/aws/aws-sdk-go-v2/service/sso v1.11.0 // indirect
        github.com/aws/aws-sdk-go-v2/service/sts v1.16.0 // indirect
        github.com/aws/smithy-go v1.11.1 // indirect
        github.com/davecgh/go-spew v1.1.1 // indirect
        github.com/jmespath/go-jmespath v0.4.0 // indirect
        github.com/pmezard/go-difflib v1.0.0 // indirect
        github.com/stretchr/objx v0.1.0 // indirect
        golang.org/x/sys v0.0.0-20191026070338-33540a1f6037 // indirect
        gopkg.in/yaml.v3 v3.0.0-20200615113413-eeeca48fe776 // indirect
        )
