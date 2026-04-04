'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const acceptedExtensions = '.csv,.pdf,.qfx,.ofx';

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';

export function AccountsUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [message, setMessage] = useState(
    'Upload a CSV, PDF, OFX, or QFX file. We will scan it for leakage patterns and build a fresh Fix Queue.'
  );

  async function uploadFile(file: File) {
    setUploadState('uploading');
    setMessage(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.set('file', file);

      setUploadState('analyzing');
      setMessage('Ghost Money Scanner is reviewing balances, fees, and missed opportunities...');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Analysis failed.');
      }

      setUploadState('complete');
      setMessage(payload.message ?? 'Analysis complete.');
      router.refresh();
    } catch (caughtError) {
      setUploadState('error');
      setMessage(
        caughtError instanceof Error ? caughtError.message : 'Analysis failed.'
      );
    }
  }

  function onFileSelect(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    void uploadFile(file);
  }

  return (
    <section className="accounts-uploader-card">
      <div className="section-heading">Connect new statements</div>
      <p className="section-subheading">
        Demo-safe beta flow. We analyze uploaded files and create educational findings instead of moving money.
      </p>

      <div
        className={dragActive ? 'upload-dropzone active' : 'upload-dropzone'}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          onFileSelect(event.dataTransfer.files);
        }}
      >
        <div className="upload-icon">+</div>
        <div className="upload-copy">
          <strong>Drag and drop a file here</strong>
          <span>or browse from your computer</span>
        </div>
        <button
          type="button"
          className="primary-button compact-button"
          onClick={() => inputRef.current?.click()}
          disabled={uploadState === 'uploading' || uploadState === 'analyzing'}
        >
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedExtensions}
          hidden
          onChange={(event) => onFileSelect(event.target.files)}
        />
      </div>

      <div className="upload-status-card">
        <div className="upload-status-label">Scanner status</div>
        <div className="upload-status-value">{message}</div>
      </div>

      {uploadState === 'complete' ? (
        <div className="inline-actions">
          <button
            type="button"
            className="primary-button compact-button"
            onClick={() => router.push('/findings')}
          >
            View findings
          </button>
          <button
            type="button"
            className="ghost-button compact-button"
            onClick={() => router.push('/fix-queue')}
          >
            Open Fix Queue
          </button>
        </div>
      ) : null}
    </section>
  );
}
