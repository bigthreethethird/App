import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

export interface CheckoutDto {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

const STRIPE_FALLBACK = { url: null, error: 'Stripe not configured' };

@Injectable()
export class BillingService {
  private readonly stripe: Stripe | null;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY)
      : null;
  }

  private async brand(userId: string) {
    const b = await this.prisma.brand.findUnique({ where: { clerkId: userId } });
    if (!b) throw new NotFoundException('Brand not found');
    return b;
  }

  async createCheckout(userId: string, dto: CheckoutDto) {
    if (!this.stripe) return STRIPE_FALLBACK;
    if (!dto.priceId) return { url: null, error: 'Missing priceId' };
    const b = await this.brand(userId);
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: b.stripeCustomerId || undefined,
      customer_email: b.stripeCustomerId ? undefined : b.email || undefined,
      line_items: [{ price: dto.priceId, quantity: 1 }],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      metadata: { brandId: b.id, clerkId: userId },
    });
    return { url: session.url };
  }

  async portal(userId: string) {
    if (!this.stripe) return STRIPE_FALLBACK;
    const b = await this.brand(userId);
    if (!b.stripeCustomerId) {
      throw new NotFoundException('No billing account yet — subscribe to a plan first');
    }
    const session = await this.stripe.billingPortal.sessions.create({
      customer: b.stripeCustomerId,
      return_url:
        process.env.STRIPE_PORTAL_RETURN_URL ||
        'http://localhost:3000/dashboard/settings/billing',
    });
    return { url: session.url };
  }

  async subscription(userId: string) {
    const b = await this.brand(userId);
    if (!b.stripeSubscriptionId || b.subscriptionStatus === 'inactive') {
      return { status: 'inactive' };
    }
    return {
      status: b.subscriptionStatus,
      plan: b.plan || null,
      currentPeriodEnd: b.currentPeriodEnd,
      cancelAtPeriodEnd: b.cancelAtPeriodEnd,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!this.stripe) return { received: true };
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return { received: true };
    if (!signature) return { received: false };
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      return { received: false };
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = (session.metadata?.clerkId || null) as string | null;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null;
        if (!clerkId) return { received: true, skipped: 'no clerkId' };
        const brand = await this.prisma.brand.findUnique({ where: { clerkId } });
        if (!brand) return { received: true, skipped: 'brand not found' };
        await this.prisma.brand.update({
          where: { id: brand.id },
          data: {
            stripeCustomerId: customerId || brand.stripeCustomerId,
            stripeSubscriptionId: subscriptionId || brand.stripeSubscriptionId,
            subscriptionStatus: 'active',
          },
        });
        // Best-effort: enrich with subscription details for the dashboard.
        if (subscriptionId) {
          try {
            const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
            await this.syncSubscription(brand.id, sub);
          } catch {
            /* enrichment is optional */
          }
        }
        return { received: true };
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const brand = await this.prisma.brand.findFirst({
          where: { stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id },
        });
        if (!brand) return { received: true, skipped: 'brand not found' };
        await this.syncSubscription(brand.id, sub);
        return { received: true };
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        await this.prisma.brand.updateMany({
          where: { stripeCustomerId: customerId || undefined },
          data: { subscriptionStatus: 'canceled', cancelAtPeriodEnd: false },
        });
        return { received: true };
      }
      default:
        return { received: true, unhandled: event.type };
    }
  }

  private async syncSubscription(brandId: string, sub: Stripe.Subscription) {
    const item = sub.items?.data?.[0];
    const price = item?.price;
    await this.prisma.brand.update({
      where: { id: brandId },
      data: {
        subscriptionStatus: sub.status,
        plan: price?.nickname || price?.id || 'custom',
        currentPeriodEnd: item?.current_period_end
          ? new Date(item.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      },
    });
  }
}
