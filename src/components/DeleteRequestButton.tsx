import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';
import { deleteRequest } from '../lib/requestService';

interface DeleteRequestButtonProps {
  requestId: string;
  topicSummary: string;
  variant?: 'inline' | 'button';
  onDeleted?: () => void;
}

/** Deletes a collection request and all S3 objects under its prefix after confirmation. */
export function DeleteRequestButton({
  requestId,
  topicSummary,
  variant = 'button',
  onDeleted,
}: DeleteRequestButtonProps) {
  const { s3Client } = useAwsCredentials();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => deleteRequest(s3Client!, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['registry'] });
      await queryClient.removeQueries({ queryKey: ['request', requestId] });
      onDeleted?.();
      if (variant === 'button') {
        navigate('/');
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    },
  });

  function handleClick() {
    setError(null);
    const confirmed = window.confirm(
      `Delete collection request "${topicSummary}"?\n\nThis permanently removes request ${requestId}, its data cube, artifacts, and all associated S3 objects. This cannot be undone.`,
    );
    if (confirmed) {
      mutation.mutate();
    }
  }

  const className =
    variant === 'inline'
      ? 'text-red-300 underline hover:text-red-200 disabled:opacity-50'
      : 'rounded border border-tactical-danger px-4 py-2 text-red-200 hover:bg-tactical-danger/20 disabled:opacity-50';

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={handleClick} disabled={mutation.isPending} className={className}>
        {mutation.isPending ? 'Deleting…' : 'Delete'}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </span>
  );
}
