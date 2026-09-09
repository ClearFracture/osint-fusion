/** Application configuration from Vite environment variables. */
export interface AppConfig {
  region: string;
  bucket: string;
  prefix: string;
  belvederePipelineUrl: string;
  athenaDatabase: string;
  athenaOutput: string;
}

export function getConfig(): AppConfig {
  return {
    region: import.meta.env.VITE_AWS_REGION ?? 'us-east-1',
    bucket: import.meta.env.VITE_S3_BUCKET ?? 'cf-hackathon',
    prefix: import.meta.env.VITE_S3_PREFIX ?? 'osint-fusion-app',
    belvederePipelineUrl: import.meta.env.VITE_BELVEDERE_PIPELINE_URL ?? '',
    athenaDatabase: import.meta.env.VITE_ATHENA_DATABASE ?? 'osint_fusion',
    athenaOutput:
      import.meta.env.VITE_ATHENA_OUTPUT ??
      's3://cf-hackathon/osint-fusion-app/athena-results/',
  };
}

/** Build an S3 object key under the app prefix. */
export function appKey(relativePath: string): string {
  const { prefix } = getConfig();
  const normalized = relativePath.replace(/^\/+/, '');
  return `${prefix}/${normalized}`;
}

/** Full s3:// URI for a key under bucket + app prefix. */
export function s3Uri(relativePath: string): string {
  const { bucket } = getConfig();
  return `s3://${bucket}/${appKey(relativePath)}`;
}
