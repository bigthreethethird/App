import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service'; import { PrismaService } from '../prisma/prisma.service';

@Module({ controllers: [ProductsController, AnalyticsController, BrandController], providers: [ProductsService, AnalyticsService, BrandService, PrismaService] })
export class AdminModule {}
