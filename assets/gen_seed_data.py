import io
import os

import boto3
import numpy as np
import pandas as pd

s3_client = boto3.client("s3")

SAGEMAKER_ROLE = "arn:aws:iam::570405429484:role/service-role/AmazonSageMaker-ExecutionRole-20201222T192023"
SAGEMAKER_BUCKET = "aws-ml-blog-sagemaker-census-segmentation"
PERIOD_START = pd.to_datetime("2022-01-01")
PERIOD_END = pd.to_datetime("2022-03-14")
DATA_DIR = "data"

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)


def gen_random_dates(start: pd.Timestamp, end: pd.Timestamp, n=int):
    start_u = start.value // 10**9
    end_u = end.value // 10**9
    return pd.to_datetime(np.random.randint(start_u, end_u, n), unit="s").strftime("%Y-%m-%d")


def get_s3_file(bucket: str) -> None:
    obj_list = s3_client.list_objects(Bucket=bucket)
    file = [contents["Key"] for contents in obj_list["Contents"]]
    response = s3_client.get_object(Bucket=SAGEMAKER_BUCKET, Key=file[0])
    response_body = response["Body"].read()
    data = pd.read_csv(
        io.BytesIO(response_body), header=0, delimiter=",", low_memory=False
    )
    data.dropna(inplace=True)
    data["createdAt"] = gen_random_dates(PERIOD_START, PERIOD_END, data.shape[0])
    return data


if __name__ == "__main__":
    data = get_s3_file(SAGEMAKER_BUCKET)
    data.to_json(f"{DATA_DIR}/seed-data.json", orient="records")
