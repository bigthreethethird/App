import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { HealthController } from './health/health.controller';
import { MeController } from './auth/me.controller';
import { ConsumerController } from './consumer/consumer.controller';
import { WaitlistModule } from './waitlist/waitlist.module';
import { AdminModule } from './admin/admin.module';
import { TapModule } from './tap/tap.module';
import { BillingModule } from './billing/billing.module';
import { UploadModule } from './upload/upload.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [WaitlistModule, AdminModule, TapModule, BillingModule, UploadModule, ChatModule],
  controllers: [HealthController, MeController, ConsumerController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
