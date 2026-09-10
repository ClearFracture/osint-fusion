import { S3_CORS_SETUP_HINT } from '../lib/aws/corsError';

/** Shown when S3 calls fail due to missing bucket CORS configuration. */
export function CorsErrorPanel() {
  return (
    <div className="rounded border border-amber-700 bg-amber-900/25 px-4 py-4 text-sm text-amber-100">
      <p className="font-display font-semibold text-amber-200">S3 CORS configuration required</p>
      <p className="mt-2">{S3_CORS_SETUP_HINT}</p>
      <p className="mt-3 text-tactical-muted">
        A bucket admin must add CORS on <code className="text-tactical-gold">cf-hackathon</code>{' '}
        allowing <code className="text-tactical-gold">http://localhost:5173</code> (and your
        production URL). Example rule file:{' '}
        <code className="text-tactical-gold">docs/operator/s3-cors.json</code>
      </p>
      <pre className="mt-3 overflow-x-auto rounded border border-tactical-border bg-tactical-bg p-3 text-xs text-tactical-text">
        {`aws s3api put-bucket-cors \\
  --bucket cf-hackathon \\
  --cors-configuration file://docs/operator/s3-cors.json \\
  --region us-east-1`}
      </pre>
    </div>
  );
}
