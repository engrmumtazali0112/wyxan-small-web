import { Module } from '@nestjs/common';
import { SanitizeService } from './sanitize.service.js';

@Module({
  providers: [SanitizeService],
  exports: [SanitizeService],
})
export class SanitizeModule {}
