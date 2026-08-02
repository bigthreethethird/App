'use client';
import { useCallback, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface FileUploadProps {
  onUpload: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  initialUrl?: string;
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,application/pdf';

export default function FileUpload({
  onUpload,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 10,
  label = 'Upload file',
  initialUrl,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [url, setUrl] = useState(initialUrl || '');
  const [pasteUrl, setPasteUrl] = useState('');

  const acceptedList = accept.split(',').map((s) => s.trim());
  const maxBytes = maxSizeMB * 1024 * 1024;

  const validate = (file: File): string => {
    if (!acceptedList.includes(file.type)) {
      return `File type "${file.type || 'unknown'}" isn't supported. Allowed: images (JPEG/PNG/WebP/GIF), MP4 video, PDF.`;
    }
    if (file.size > maxBytes) {
      return `File is too large — max ${maxSizeMB}MB.`;
    }
    return '';
  };

  const upload = useCallback(
    async (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError('');
      setBusy(true);
      setProgress(12);
      try {
        const res = await api.upload(file);
        setProgress(100);
        if (res.url) {
          setUrl(res.url);
          setPasteUrl('');
          onUpload(res.url);
        } else {
          setError(res.error || 'Upload failed');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setBusy(false);
        setTimeout(() => setProgress(0), 800);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxBytes, maxSizeMB, acceptedList.join(), onUpload],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  const applyPastedUrl = () => {
    const value = pasteUrl.trim();
    if (!value) return;
    if (!/^https?:\/\//.test(value)) {
      setError('Please paste a full http(s) URL.');
      return;
    }
    setUrl(value);
    setError('');
    onUpload(value);
  };

  const isImage = url && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);

  return (
    <div className="space-y-3">
      <span className="text-xs font-bold uppercase tracking-[.12em] text-text-secondary">{label}</span>

      {!url ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={`${label} — drop file, click to browse, or paste a URL`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition ${
            drag ? 'border-accent bg-accent-soft' : 'border-white/20 bg-white/[.03] hover:bg-white/[.06]'
          }`}
        >
          <span className="text-2xl text-accent">⬆</span>
          <p className="text-sm text-text-secondary">Drop file here or <span className="text-accent">browse</span></p>
          <p className="text-xs text-text-muted">
            {accept.split(',').map((t) => t.split('/')[1]?.toUpperCase()).join(' · ')} · up to {maxSizeMB}MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = '';
            }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.04] p-4">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Uploaded preview" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/[.06] text-xl">📄</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-primary">{url}</p>
            <button
              type="button"
              onClick={() => {
                setUrl('');
                onUpload('');
              }}
              className="mt-1 text-xs text-error hover:underline"
            >
              Remove & re-upload
            </button>
          </div>
        </div>
      )}

      {busy && (
        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D9A441] to-[#E7B95A] transition-all duration-200"
              style={{ width: `${Math.max(progress, 8)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-text-muted">Uploading… {progress}%</p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}

      {!url && (
        <div className="flex items-center gap-2">
          <input
            value={pasteUrl}
            onChange={(e) => {
              setPasteUrl(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && applyPastedUrl()}
            placeholder="…or paste a URL"
            aria-label={`${label} — paste a URL`}
            className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.045] px-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
          />
          <button
            type="button"
            onClick={applyPastedUrl}
            className="h-10 rounded-xl border border-white/15 px-3 text-sm text-text-secondary hover:bg-white/[.09]"
          >
            Use URL
          </button>
        </div>
      )}
    </div>
  );
}
