PACKAGES=./internal...
COVERAGE=coverage.out
LINKER_FLAGS=-X github.com/bcgalvin/cdk-kinesis-firehose/lambdas/internal/pkg

all: test build

build: compile-local

compile-local:
	go build -ldflags "${LINKER_FLAGS}" -o ${DESTINATION} ./cmd/application

test: run-unit-test

run-unit-test:
	go test -race -cover -count=1 -coverprofile ${COVERAGE} ${PACKAGES}

compile-local:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags ${LINKER_FLAGS} -o ${DESTINATION} ./cmd/application
