/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_ACCESS_KEY_ID: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY: string;
  readonly VITE_AWS_SESSION_TOKEN: string;
  readonly VITE_AWS_REGION: string;
  readonly VITE_S3_BUCKET: string;
  readonly VITE_S3_PREFIX: string;
  readonly VITE_BELVEDERE_PIPELINE_URL: string;
  readonly VITE_ATHENA_DATABASE: string;
  readonly VITE_ATHENA_OUTPUT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
