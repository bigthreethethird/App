import { Controller, Get, Param, Post, Req, Body } from '@nestjs/common';
import { TapService } from './tap.service';

@Controller('api/tap')
export class TapController {
  constructor(private readonly service: TapService) {}
  private context(req: any) { return { ip: req.ip || req.headers['x-forwarded-for'] || 'unknown', ua: req.headers['user-agent'] }; }
  @Get(':nfcId') get(@Param('nfcId') nfcId: string, @Req() req: any) { const c = this.context(req); return this.service.lookup(nfcId, c.ip, c.ua); }
  @Post(':nfcId/scan') scan(@Param('nfcId') nfcId: string, @Req() req: any, @Body() body: { latitude?: number; longitude?: number }) { const c = this.context(req); return this.service.scan(nfcId, c.ip, c.ua, body?.latitude, body?.longitude); }
}
