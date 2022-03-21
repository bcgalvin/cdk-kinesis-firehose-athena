# 3. bucket-deployment-service-entrypoint

Date: 2022-03-14

## Status

Accepted

## Context

We need a way to initiate data flow through this reference architecture, using data uploaded to a raw s3 bucket as the
entrypoint.

## Decision

Several options were considered:

- manual triggering via script or service behind api-gateway
- use a lambda to copy s3 files to raw bucket as a cfn custom resource
- loading local data to raw bucket as part of the deployment process

We decided to go with the third option, as it would require no manual intervention (like option #2) and would keep
things a bit simpler with less moving pieces.

## Consequences

Using a bucket deployment makes this solution less realistic since we can't use an S3 PutObject event to trigger
downstream actions. This limitation isn't that big of a deal however, as the main goal here is to demonstrate how to
hydrate a data warehouse from dynamodb.

