import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('WaitlistController', () => {
  const signups = new Set<string>();
  let controller: WaitlistController;
  beforeEach(async () => {
    signups.clear();
    const prisma = { waitlistSignup: { findUnique: jest.fn(({ where }) => signups.has(where.email) ? { email: where.email } : null), create: jest.fn(({ data }) => { signups.add(data.email); return { id: 'signup-1', ...data }; }) } };
    const module = await Test.createTestingModule({ controllers: [WaitlistController], providers: [WaitlistService, { provide: PrismaService, useValue: prisma }] }).compile();
    controller = module.get(WaitlistController);
  });
  it('accepts a valid email', async () => { await expect(controller.create({ email: 'brand@example.com', consent: true })).resolves.toMatchObject({ email: 'brand@example.com' }); });
  it('rejects an invalid email with a 400 exception', async () => { await expect(controller.create({ email: 'not-an-email', consent: true })).rejects.toBeInstanceOf(BadRequestException); });
  it('rejects a duplicate email with a 409 exception', async () => { await controller.create({ email: 'brand@example.com', consent: true }); await expect(controller.create({ email: 'brand@example.com', consent: true })).rejects.toBeInstanceOf(ConflictException); });
});
