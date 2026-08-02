import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns an OK health status when the database is reachable', async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } }],
    }).compile();
    // The controller's constructor type is structural; override the token used by Nest.
    const controller = module.get(HealthController);
    await expect(controller.health()).resolves.toEqual({ status: 'ok', database: 'connected' });
  });
});
