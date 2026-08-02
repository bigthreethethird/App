'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

const PRICES = {
  essential: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIAL || 'price_essential',
  growth: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH || 'price_growth',
};

const TIERS = [
  {
    key: 'essential',
    name: 'Essential',
    price: '$99',
    blurb: 'Product passport · COA/media uploads · Basic scans',
    features: ['Digital product passports', 'COA & media uploads', 'Consumer tap experience', 'Basic scan analytics'],
  },
  {
    key: 'growth',
    name: 'Growth',
    price: '$249',
    blurb: 'Everything Essential · Analytics · Campaigns · Priority support',
    features: ['Everything in Essential', 'Advanced analytics & maps', 'Marketing campaigns', 'AI Budtender chat', 'Priority support'],
    popular: true,
  },
  {
    key: 'partner',
    name: 'Partner',
    price: "Let's talk",
    blurb: 'Multi-brand workflows · Tailored support',
    features: ['Multi-brand workspaces', 'Custom integrations', 'Dedicated success team'],
  },
] ;

function PlanButton({
  tier,
  busy,
  onSubscribe,
}: {
  tier: (typeof TIERS)[number];
  busy: boolean;
  onSubscribe: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (tier.key === 'partner') {
    return (
      <a href="mailto:hello@cannect.app" className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-text-primary hover:bg-white/[.09]">
        Contact us
      </a>
    );
  }

  async function subscribe() {
    if (loading || busy) return;
    setLoading(true);
    setError('');
    const base = window.location.origin;
    try {
      const res = await api.billing.createCheckout(
        tier.key === 'essential' ? PRICES.essential : PRICES.growth,
        `${base}/dashboard/settings/billing?checkout=success`,
        `${base}/pricing?checkout=cancelled`,
      );
      if (res.url) {
        window.location.href = res.url;
      } else {
        setError(res.error || 'Unable to start checkout');
      }
    } catch {
      setError('Unable to start checkout. Are you signed in?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        disabled={loading || busy}
        onClick={subscribe}
        className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-[0_8px_24px_rgba(217,164,65,.18)] transition hover:brightness-105 disabled:opacity-50 ${
          tier.popular ? 'bg-accent text-text-accent' : 'border border-white/15 text-text-primary hover:bg-white/[.09]'
        }`}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Opening checkout…
          </>
        ) : (
          'Subscribe'
        )}
      </button>
      {error && <p className="mt-2 text-center text-xs text-error">{error}</p>}
    </div>
  );
}

export default function PricingPage() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  return (
    <main className="min-h-dvh bg-canvas">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="/" className="text-xl font-semibold tracking-tight text-text-primary">
          cannect
        </a>
        <div className="flex items-center gap-2">
          <a href="/sign-in" className="hidden rounded-xl px-4 py-3 text-sm text-text-secondary sm:block">
            Log in
          </a>
          <a href="/sign-up" className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-text-accent">
            Get started
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 md:px-8 md:pt-14">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-accent">Simple, scalable</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Start with trust. Scale with proof.</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-secondary">
          Every plan includes the digital product passport, consumer tap experience, and verified lab data.
          No hardware required — use any NFC tag or QR.
        </p>

        {notice && (
          <p role="status" className="mt-6 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
            {notice}
          </p>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TIERS.map((tier) => (
            <article
              key={tier.key}
              className={`glass relative rounded-2xl p-6 ${
                tier.popular ? 'border-accent shadow-[0_0_35px_rgba(217,164,65,.12)]' : ''
              }`}
            >
              {tier.popular && (
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  Most popular
                </span>
              )}
              <h2 className="mt-4 text-xl font-semibold">{tier.name}</h2>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {tier.price}
                {tier.key !== 'partner' && <small className="text-sm font-normal text-text-secondary"> / month</small>}
              </p>
              <p className="mt-4 min-h-12 text-sm leading-relaxed text-text-secondary">{tier.blurb}</p>
              <ul className="mt-6 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="mt-0.5 text-accent">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <PlanButton tier={tier} busy={busy} onSubscribe={() => setBusy(true)} />
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-xs text-text-muted">
          Plans are billed monthly and can be cancelled anytime from the billing portal. Prices shown are MVP launch pricing, subject to change.
        </p>
      </section>
    </main>
  );
}
