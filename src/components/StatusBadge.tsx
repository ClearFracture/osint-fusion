import type { RequestStatus } from '../types/request';

const STYLES: Record<RequestStatus, string> = {
  pending: 'bg-tactical-panel text-tactical-muted border-tactical-border',
  building: 'bg-amber-900/40 text-amber-200 border-amber-700',
  ready: 'bg-tactical-ready/30 text-green-200 border-tactical-ready',
  failed: 'bg-tactical-danger/30 text-red-200 border-tactical-danger',
};

const LABELS: Record<RequestStatus, string> = {
  pending: 'PENDING',
  building: 'BUILDING',
  ready: 'READY',
  failed: 'FAILED',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 font-display text-xs font-semibold tracking-wider ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
