# S3 bucket CORS configuration

OSINT-Fusion is a browser SPA. The AWS SDK calls S3 directly from the user's browser (`fetch` to `https://cf-hackathon.s3.us-east-1.amazonaws.com/...`). S3 must return `Access-Control-Allow-Origin` on **preflight `OPTIONS`** and data requests, or the browser blocks access.

This is **not** fixable in application code alone — a bucket administrator must apply CORS on **`cf-hackathon`**.

## Symptoms

Console error:

```
Access to fetch at 'https://cf-hackathon.s3.us-east-1.amazonaws.com/osint-fusion-app/...'
from origin 'http://localhost:5173' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Apply CORS (AWS CLI)

From this repository root:

```bash
aws s3api put-bucket-cors \
  --bucket cf-hackathon \
  --cors-configuration file://docs/operator/s3-cors.json \
  --region us-east-1
```

Verify:

```bash
aws s3api get-bucket-cors --bucket cf-hackathon --region us-east-1
```

## Apply CORS (AWS Console)

1. Open **S3** → bucket **`cf-hackathon`**
2. **Permissions** → **Cross-origin resource sharing (CORS)**
3. Paste the contents of [`s3-cors.json`](./s3-cors.json)
4. Save

## Production origins

Add your deployed SPA origin(s) to `AllowedOrigins` in `s3-cors.json`, for example:

```json
"https://osint-fusion.example.com"
```

Then re-run `put-bucket-cors`.

## Merge with existing rules

If the bucket already has CORS rules, **append** a new rule object to the `CORSRules` array rather than replacing unrelated application rules.

## Note on Athena and STS

- **S3** requires bucket CORS (this document).
- **STS** (`GetCallerIdentity`) and **Athena** APIs are also invoked from the browser. If those fail with similar CORS errors after S3 is fixed, credentials may need to be used from a same-origin proxy or the AWS account must allow browser access to those service endpoints. In practice, S3 CORS is the first blocker for registry load errors like `registry/requests.json`.
