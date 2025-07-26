import { Controller, Get } from '@nestjs/common';
// import { Public } from '../features/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  // @Public() // Route publique, pas d'auth requise
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'foodtracker-backend',
    };
  }
}