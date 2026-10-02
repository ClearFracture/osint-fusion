import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '../../components/Panel';
import { getConfig } from '../../config/env';
import { useAwsCredentials } from '../../contexts/AwsCredentialsContext';
import { buildConnectInstructions } from '../../lib/connectInstructions';
import { buildPayloadSchemaRefsQuery, runQuery } from '../../lib/aws/athenaRepository';
import { loadPayloadSchemaRegistry } from '../../lib/schemaService';

type Tool = 'qgis' | 'tableau';

export function ConnectTab({ requestId }: { requestId: string }) {
  const [tool, setTool] = useState<Tool>('qgis');
  const { s3Client, athenaClient } = useAwsCredentials();
  const { athenaTable } = getConfig();

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

  async function copyVrt() {
    await navigator.clipboard.writeText(instructions.qgisVrt);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <ToolCard
          label="QGIS"
          description="Athena JDBC layer via .vrt"
          active={tool === 'qgis'}
          onClick={() => setTool('qgis')}
        />
        <ToolCard
          label="Tableau"
          description={`Athena connector → ${athenaTable}`}
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
        {tool === 'qgis' && (
          <div className="mt-4">
            <pre className="max-h-96 overflow-auto rounded border border-tactical-border bg-tactical-bg p-4 text-xs whitespace-pre-wrap">
              {instructions.qgisVrt}
            </pre>
            <button
              type="button"
              onClick={copyVrt}
              className="mt-4 rounded border border-tactical-gold px-4 py-2 text-tactical-gold hover:bg-tactical-gold/10"
            >
              Copy .vrt
            </button>
          </div>
        )}
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
