'use client';

import { useState } from 'react';

export function DownloadMemoButton({
  label = 'Generate CPA Memo',
  className = 'secondary-button',
}: {
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/memo', { method: 'POST' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to generate memo.');
      }

      const blob = new Blob([payload.memo], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = payload.filename ?? 'shadow-cfo-cpa-memo.txt';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Unable to generate memo.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-action">
      <button type="button" className={className} onClick={handleClick} disabled={loading}>
        {loading ? 'Preparing memo...' : label}
      </button>
      {error ? <p className="inline-error">{error}</p> : null}
    </div>
  );
}
