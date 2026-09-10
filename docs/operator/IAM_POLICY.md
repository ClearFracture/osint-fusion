# Analyst IAM Policy (minimum)

Grants access to the OSINT-Fusion app prefix on the shared hackathon bucket, including permissions for the app to **bootstrap** S3 registry files and Athena/Glue catalog objects on first login.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::cf-hackathon",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["osint-fusion-app/*"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::cf-hackathon/osint-fusion-app/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "athena:StartQueryExecution",
        "athena:GetQueryExecution",
        "athena:GetQueryResults"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "glue:GetDatabase",
        "glue:GetTable",
        "glue:GetPartitions",
        "glue:CreateDatabase",
        "glue:CreateTable",
        "glue:CreatePartition",
        "glue:UpdateTable"
      ],
      "Resource": "*"
    }
  ]
}
```

`glue:CreateDatabase` and `glue:CreateTable` are required for automatic Athena bootstrap. Analysts with read-only Glue access must use [manual setup](../../README.md#manual-aws-setup) instead.

PutObject is required for analysts who create collection requests and for first-run infrastructure bootstrap.
