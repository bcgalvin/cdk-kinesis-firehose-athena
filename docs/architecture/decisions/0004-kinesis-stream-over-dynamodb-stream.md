# 4. kinesis-stream-over-dynamodb-stream

Date: 2022-03-17

## Status

Accepted

## Context

Dynamodb offers both ddb streams and kinesis for change-data-capture events coming off a ddb table. We need to take
change events and send them to kinesis firehose to persist them to s3.

## Decision

Dynamodb streams have guarantees on duplicate records and time ordering that kinesis does not but would require an
additional lambda for processing events and loading them to kinesis firehose. We decided to go with kinesis as the
eventual goal of this application is to hydrate a data warehouse and not do anything real-time with these data.

## Consequences

There is a possibility that the data landing in s3 may contain duplicates and not be in the correct order. This can be
addressed by our elt framework and should not be an issue. If the needs of the application change we can revisit this
and easily refactor to use ddb streams. 
