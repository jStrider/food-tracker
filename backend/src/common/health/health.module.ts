import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { EnhancedHealthController } from './enhanced-health.controller';

@Module({
  imports: [
    TerminusModule,
    HttpModule, // Required for HTTP health checks
  ],
  controllers: [EnhancedHealthController],
})
export class HealthModule {}