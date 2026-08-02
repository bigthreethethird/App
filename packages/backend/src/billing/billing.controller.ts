import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/auth.guard';
import { BillingService, CheckoutDto } from './billing.service';

@Controller('api')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  private uid(r: any) {
    return r.auth?.userId || r.headers['x-clerk-user-id'] || 'demo-user';
  }

  @Post('admin/billing/create-checkout')
  @UseGuards(ClerkAuthGuard)
  createCheckout(@Req() r: any, @Body() body: CheckoutDto) {
    return this.service.createCheckout(this.uid(r), body);
  }

  @Get('admin/billing/portal')
  @UseGuards(ClerkAuthGuard)
  portal(@Req() r: any) {
    return this.service.portal(this.uid(r));
  }

  @Get('admin/billing/subscription')
  @UseGuards(ClerkAuthGuard)
  subscription(@Req() r: any) {
    return this.service.subscription(this.uid(r));
  }

  // Public webhook — raw body is captured via Nest's rawBody option in main.ts.
  @Post('webhooks/stripe')
  @HttpCode(200)
  webhook(@Req() r: any) {
    const raw: Buffer = r.rawBody || Buffer.from(JSON.stringify(r.body || {}));
    const sig: string | undefined = r.headers['stripe-signature'];
    return this.service.handleWebhook(raw, sig);
  }
}
