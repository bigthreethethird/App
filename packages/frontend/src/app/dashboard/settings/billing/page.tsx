'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type SubInfo = { status: string; plan?: string | null; currentPeriodEnd?: string | null; cancelAtPeriodEnd?: boolean };

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
        <span aria-hidden>✓</span> Active
      </span>
    );
  }
  if (status === 'canceled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-error-soft px-2.5 py-1 text-xs font-semibold text-error">
        <span aria-hidden>✕</span> Canceled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[.08] px-2.5 py-1 text-xs font-semibold text-text-secondary">
      <span aria-hidden>○</span> Inactive
    </span>
  );
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null;

export default function BillingPage() {
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.billing.subscription();
      setSub(res);
    } catch {
      setError('We couldn&apos;t load your billing details right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') setNotice('Your subscription was set up. Welcome aboard!');
    if (params.get('checkout') === 'cancelled') setNotice('Checkout was cancelled — no changes were made.');
  }, [load]);

  const openPortal = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.billing.portal();
      if (res.url) {
        window.location.href = res.url;
      } else {
        setError(res.error || 'Billing portal isn&apos;t available yet.');
      }
    } catch {
      setError('We couldn&apos;t open the billing portal right now.');
    } finally {
      setBusy(false);
    }
  };

  const active = sub?.status === 'active';
  const endDate = active ? fmtDate(sub?.currentPeriodEnd) : null;

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[.12em] text-accent">Workspace</p>
      <h1 className="mt-3 text-4xl font-semibold">Billing</h1>

      {notice && (
        <p role="status" className="mt-6 max-w-2xl rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 max-w-2xl rounded-xl border border-error/30 bg-error-soft px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      <div className="glass mt-10 max-w-2xl rounded-2xl p-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-8 w-56 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-64 animate-pulse rounded bg-white/10" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Current plan</h2>
              {sub && <StatusBadge status={sub.status} />}
            </div>

            {active ? (
              <div className="mt-6 space-y-3">
                <p className="text-3xl font-semibold capitalize">
                  {sub?.plan ? sub.plan.replace(/^price_/, '').replace(/-/g, ' ') : 'Growth'}
                </p>
                {endDate && (
                  <p className="text-sm text-text-secondary">
                    Next billing date:{' '}
                    <span className="font-semibold text-text-primary">{endDate}</span>
                    {sub?.cancelAtPeriodEnd ? (
                      <span className="ml-2 text-warning">(cancels at period end)</span>
                    ) : null}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    disabled={busy}
                    onClick={openPortal}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-text-accent disabled:opacity-50"
                  >
                    {busy ? 'Opening portal…' : 'Manage Subscription'}
                  </button>
                  <a
                    href="/pricing"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-text-primary hover:bg-white/[.09]"
                  >
                    Upgrade Plan
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-lg text-text-secondary">
                  You&apos;re on the free trial. Subscribe to unlock the full product passport experience.
                </p>
                <div className="flex flex-wrap gap-3 pt-5">
                  <a
                    href="/pricing"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-text-accent"
                  >
                    Choose a plan
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
