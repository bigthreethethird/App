import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TapService {
  private readonly requests = new Map<string, { count: number; started: number }>();
  constructor(private readonly prisma: PrismaService) {}

  private rateLimit(ip: string) {
    const now = Date.now(); const current = this.requests.get(ip);
    if (!current || now - current.started >= 60_000) this.requests.set(ip, { count: 1, started: now });
    else { current.count += 1; if (current.count > 60) throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS); }
  }
  private async product(nfcId: string) {
    const product = await this.prisma.product.findUnique({ where: { nfcId }, include: { brand: true, cannabinoidProfile: true, terpeneProfile: true, media: true, coa: true, _count: { select: { scans: true } } } });
    if (!product || !product.published) throw new NotFoundException({ error: 'Product not found' });
    return product;
  }
  private async record(productId: string, ip: string, userAgent?: string, latitude?: number, longitude?: number) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await this.prisma.scan.findFirst({ where: { productId, ipAddress: ip, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } });
    if (recent) return this.prisma.scan.update({ where: { id: recent.id }, data: { scanCount: { increment: 1 } } });
    return this.prisma.scan.create({ data: { productId, ipAddress: ip, userAgent, latitude, longitude } });
  }
  async lookup(nfcId: string, ip: string, userAgent?: string) { this.rateLimit(ip); const product = await this.product(nfcId); await this.record(product.id, ip, userAgent); return this.product(nfcId); }
  async scan(nfcId: string, ip: string, userAgent?: string, latitude?: number, longitude?: number) { this.rateLimit(ip); const product = await this.product(nfcId); await this.record(product.id, ip, userAgent, latitude, longitude); return { success: true, scanCount: (await this.prisma.scan.count({ where: { productId: product.id } })) }; }
}
