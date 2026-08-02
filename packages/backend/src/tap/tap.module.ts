import { Module } from '@nestjs/common';
import { TapController } from './tap.controller';
import { TapService } from './tap.service';

@Module({ controllers: [TapController], providers: [TapService] })
export class TapModule {}
