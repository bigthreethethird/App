import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TapController } from './tap.controller';
import { TapService } from './tap.service';
import { NotFoundException } from '@nestjs/common';

describe('TapController', () => {
  const product = { id: 'product-1', nfcId: 'nfc-demo', name: 'Demo flower', published: true, brand: { name: 'Demo Brand' }, _count: { scans: 0 } };
  let controller: TapController;
  beforeEach(async () => {
    const prisma = { product: { findUnique: jest.fn(({ where }) => where.nfcId === product.nfcId ? product : null) }, scan: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}), update: jest.fn(), count: jest.fn().mockResolvedValue(1) } };
    const module = await Test.createTestingModule({ controllers: [TapController], providers: [TapService, { provide: PrismaService, useValue: prisma }] }).compile();
    controller = module.get(TapController);
  });
  it('returns product passport data for a valid NFC id', async () => { await expect(controller.get('nfc-demo', { ip: '127.0.0.1', headers: {} })).resolves.toMatchObject({ nfcId: 'nfc-demo', name: 'Demo flower' }); });
  it('returns not found for an invalid NFC id', async () => { await expect(controller.get('missing', { ip: '127.0.0.1', headers: {} })).rejects.toBeInstanceOf(NotFoundException); });
});
