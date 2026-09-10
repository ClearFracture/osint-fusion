import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '../../components/Panel';
import { useAwsCredentials } from '../../contexts/AwsCredentialsContext';
import { buildConnectInstructions } from '../../lib/connectInstructions';
import { buildPayloadSchemaRefsQuery, runQuery } from '../../lib/aws/athenaRepository';
import { loadPayloadSchemaRegistry } from '../../lib/schemaService';

type Tool = 'qgis' | 'tableau';

export function ConnectTab({ requestId }: { requestId: string }) {
  const [tool, setTool] = useState<Tool>('qgis');
  const { s3Client, athenaClient } = useAwsCredentials();

  const payloadRefsQuery = useQuery({
    queryKey: ['payload-schema-refs', requestId],
    queryFn: () => runQuery(athenaClient!, buildPayloadSchemaRefsQuery(requestId)),
    enabled: Boolean(athenaClient),
    retry: false,
  });

  const registryQuery = useQuery({
    queryKey: ['payload-schema-registry'],
    queryFn: () => loadPayloadSchemaRegistry(s3Client!),
    enabled: Boolean(s3Client),
  });

  const payloadSchemaRefs = useMemo(
    () =>
      payloadRefsQuery.data
        ?.map((row) => row.payload_schema_ref)
        .filter((ref): ref is string => Boolean(ref)) ?? [],
    [payloadRefsQuery.data],
  );

  const instructions = buildConnectInstructions(
    requestId,
    payloadSchemaRefs,
    registryQuery.data ?? null,
  );

  const steps = tool === 'qgis' ? instructions.qgis : instructions.tableau;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <ToolCard
          label="QGIS"
          description="Direct S3 parquet via GDAL /vsis3/"
          active={tool === 'qgis'}
          onClick={() => setTool('qgis')}
        />
        <ToolCard
          label="Tableau"
          description="Athena connector → osint_cube"
          active={tool === 'tableau'}
          onClick={() => setTool('tableau')}
        />
      </div>

      <Panel title={`${tool === 'qgis' ? 'QGIS' : 'Tableau'} — Establish External Link`}>
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          {steps.map((step) => (
            <li key={step} className="whitespace-pre-wrap">
              {step}
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function ToolCard({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded border p-4 text-left transition ${
        active
          ? 'border-tactical-gold bg-tactical-gold/10'
          : 'border-tactical-border hover:border-tactical-muted'
      }`}
    >
      <p className="font-display text-lg font-semibold text-tactical-gold">{label}</p>
      <p className="text-sm text-tactical-muted">{description}</p>
    </button>
  );
}
