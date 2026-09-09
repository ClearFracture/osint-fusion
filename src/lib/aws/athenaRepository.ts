import {
  AthenaClient,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  QueryExecutionState,
  StartQueryExecutionCommand,
} from '@aws-sdk/client-athena';
import type { AwsCredentials } from './credentials';
import { getConfig, s3Uri } from '../../config/env';

export function createAthenaClient(credentials: AwsCredentials): AthenaClient {
  return new AthenaClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
}

export interface AthenaScalarRow {
  [column: string]: string | null;
}

async function waitForQuery(client: AthenaClient, queryExecutionId: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const status = await client.send(
      new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId }),
    );
    const state = status.QueryExecution?.Status?.State;
    if (state === QueryExecutionState.SUCCEEDED) {
      return;
    }
    if (state === QueryExecutionState.FAILED || state === QueryExecutionState.CANCELLED) {
      const reason = status.QueryExecution?.Status?.StateChangeReason ?? 'Query failed';
      throw new Error(reason);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Athena query timed out.');
}

/** Execute DDL/DML without parsing result rows. Use `default` when creating a database. */
export async function executeDdl(
  client: AthenaClient,
  sql: string,
  catalogDatabase: string,
): Promise<void> {
  const { athenaOutput } = getConfig();
  const start = await client.send(
    new StartQueryExecutionCommand({
      QueryString: sql,
      QueryExecutionContext: { Database: catalogDatabase },
      ResultConfiguration: { OutputLocation: athenaOutput },
    }),
  );
  const queryExecutionId = start.QueryExecutionId;
  if (!queryExecutionId) {
    throw new Error('Athena did not return a query execution id.');
  }
  await waitForQuery(client, queryExecutionId);
}

export function buildCreateDatabaseDdl(): string {
  const { athenaDatabase } = getConfig();
  return `CREATE DATABASE IF NOT EXISTS ${athenaDatabase}`;
}

export function buildCreateTableDdl(): string {
  const location = s3Uri('requests/');
  return `
CREATE EXTERNAL TABLE IF NOT EXISTS osint_cube (
  record_id string,
  observed_at timestamp,
  ingested_at timestamp,
  payload_json string,
  payload_schema_ref string,
  lat double,
  lon double,
  title string,
  summary string,
  confidence double,
  artifact_refs array<struct<artifact_id:string,mime_type:string,s3_uri:string,role:string>>,
  tags array<string>,
  lineage struct<pipeline_run_id:string,belvedere_chat_id:string,extractor_version:string>
)
PARTITIONED BY (request_id string, source_type string, source_producer string)
STORED AS PARQUET
LOCATION '${location}'
  `.trim();
}

/** Run a SQL query and return rows as column-name maps. */
export async function runQuery(
  client: AthenaClient,
  sql: string,
): Promise<AthenaScalarRow[]> {
  const { athenaDatabase, athenaOutput } = getConfig();
  const start = await client.send(
    new StartQueryExecutionCommand({
      QueryString: sql,
      QueryExecutionContext: { Database: athenaDatabase },
      ResultConfiguration: { OutputLocation: athenaOutput },
    }),
  );
  const queryExecutionId = start.QueryExecutionId;
  if (!queryExecutionId) {
    throw new Error('Athena did not return a query execution id.');
  }

  await waitForQuery(client, queryExecutionId);

  const rows: AthenaScalarRow[] = [];
  let headers: string[] = [];
  let nextToken: string | undefined;
  let isFirstPage = true;

  do {
    const results = await client.send(
      new GetQueryResultsCommand({
        QueryExecutionId: queryExecutionId,
        NextToken: nextToken,
      }),
    );
    const resultRows = results.ResultSet?.Rows ?? [];

    if (isFirstPage && resultRows.length > 0) {
      headers = resultRows[0].Data?.map((cell) => cell.VarCharValue ?? '') ?? [];
      for (const row of resultRows.slice(1)) {
        rows.push(mapAthenaRow(row, headers));
      }
      isFirstPage = false;
    } else {
      for (const row of resultRows) {
        rows.push(mapAthenaRow(row, headers));
      }
    }

    nextToken = results.NextToken;
  } while (nextToken);

  return rows;
}

function mapAthenaRow(
  row: { Data?: { VarCharValue?: string }[] },
  headers: string[],
): AthenaScalarRow {
  const record: AthenaScalarRow = {};
  row.Data?.forEach((cell, index) => {
    record[headers[index]] = cell.VarCharValue ?? null;
  });
  return record;
}

export function buildOverviewQuery(requestId: string): string {
  const escaped = requestId.replace(/'/g, "''");
  return `
    SELECT
      COUNT(*) AS total_records,
      COUNT(DISTINCT source_type) AS source_type_count,
      COUNT(DISTINCT source_producer) AS producer_count
    FROM osint_cube
    WHERE request_id = '${escaped}'
  `;
}

export function buildSourceBreakdownQuery(requestId: string): string {
  const escaped = requestId.replace(/'/g, "''");
  return `
    SELECT source_type, COUNT(*) AS record_count
    FROM osint_cube
    WHERE request_id = '${escaped}'
    GROUP BY source_type
    ORDER BY record_count DESC
  `;
}
