/** Detect browser CORS / opaque network failures from AWS SDK fetch calls. */
export function isLikelyCorsError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const message =
    'message' in error && typeof error.message === 'string' ? error.message : String(error);

  return (
    /failed to fetch/i.test(message) ||
    /network error/i.test(message) ||
    /access-control/i.test(message) ||
    /\bcors\b/i.test(message)
  );
}

export const S3_CORS_SETUP_HINT =
  'The cf-hackathon S3 bucket needs CORS rules allowing this app origin. ' +
  'See docs/operator/S3_CORS.md — run: aws s3api put-bucket-cors --bucket cf-hackathon ' +
  '--cors-configuration file://docs/operator/s3-cors.json --region us-east-1';
