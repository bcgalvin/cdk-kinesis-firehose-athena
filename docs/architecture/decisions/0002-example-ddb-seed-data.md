# 2. example-ddb-seed-data

Date: 2022-03-13

## Status

Accepted

## Context

As a stretch goal we would like to demonstrate using AWS Sagemaker as part of this architecture. .

## Decision

The dynamodb seed data is sourced from
this [aws sagemaker example on clustering](https://github.com/aws/amazon-sagemaker-examples/blob/main/introduction_to_applying_machine_learning/US-census_population_segmentation_PCA_Kmeans/sagemaker-countycensusclustering.ipynb)

## Consequences

Will have to create a single table design from the csv file in the notebook to showcase some of the newer features of
kinesis firehose like dynamic partitioning.
