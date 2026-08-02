import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  private async brand(userId: string) { const b = await this.prisma.brand.findUnique({ where: { clerkId: userId } }); if (!b) throw new NotFoundException('Brand not found'); return b; }
  private include = { cannabinoidProfile: true, terpeneProfile: true, media: true, coa: true, _count: { select: { scans: true } } } as const;
  async list(userId: string) { const b = await this.brand(userId); return this.prisma.product.findMany({ where: { brandId: b.id, published: true }, include: this.include, orderBy: { updatedAt: 'desc' } }); }
  async get(userId: string, id: string) { const b = await this.brand(userId); const p = await this.prisma.product.findFirst({ where: { id, brandId: b.id }, include: this.include }); if (!p) throw new NotFoundException('Product not found'); return p; }
  private data(body: any) { const { cannabinoidProfile, terpeneProfile, media, coa, ...product } = body; return { product, cannabinoidProfile, terpeneProfile, media, coa }; }
  async create(userId: string, body: any) { const b = await this.brand(userId); const d = this.data(body); return this.prisma.product.create({ data: { ...d.product, brandId: b.id, cannabinoidProfile: d.cannabinoidProfile ? { create: d.cannabinoidProfile } : undefined, terpeneProfile: d.terpeneProfile ? { create: d.terpeneProfile } : undefined, media: d.media ? { create: d.media } : undefined, coa: d.coa ? { create: d.coa } : undefined }, include: this.include }); }
  async update(userId: string, id: string, body: any) { await this.get(userId, id); const d = this.data(body); return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => { if (d.cannabinoidProfile) await tx.cannabinoidProfile.upsert({ where: { productId: id }, create: { ...d.cannabinoidProfile, productId: id }, update: d.cannabinoidProfile }); if (d.terpeneProfile) await tx.terpeneProfile.upsert({ where: { productId: id }, create: { ...d.terpeneProfile, productId: id }, update: d.terpeneProfile }); if (d.coa) await tx.cOA.upsert({ where: { productId: id }, create: { ...d.coa, productId: id }, update: d.coa }); return tx.product.update({ where: { id }, data: d.product, include: this.include }); }); }
  async remove(userId: string, id: string) { await this.get(userId, id); return this.prisma.product.update({ where: { id }, data: { published: false }, include: this.include }); }
}
