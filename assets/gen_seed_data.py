import io
import os
from typing import Dict

import boto3
import numpy as np
import pandas as pd
from dynamodb_json import json_util

s3_client = boto3.client("s3")

SAGEMAKER_BUCKET = "aws-ml-blog-sagemaker-census-segmentation"


def save_s3_file(bucket: str) -> None:
    obj_list = s3_client.list_objects(Bucket=bucket)
    file = [contents["Key"] for contents in obj_list["Contents"]]
    response = s3_client.get_object(Bucket=SAGEMAKER_BUCKET, Key=file[0])
    response_body = response["Body"].read()
    data = pd.read_csv(
        io.BytesIO(response_body), header=0, delimiter=",", low_memory=False
    )
    data["PK"] = "STATE#" + data["State"].astype(str)
    data["SK"] = "COUNTY#" + data["County"].astype(str)
    data.to_csv("data/counties.csv", index=False)


if __name__ == "__main__":
    save_s3_file(SAGEMAKER_BUCKET)
