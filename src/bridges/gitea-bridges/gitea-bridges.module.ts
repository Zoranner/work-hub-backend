import { Module } from '@nestjs/common';
import { GiteaBridgesController } from './gitea-bridges.controller';
import { GiteaBridgesService } from './gitea-bridges.service';

@Module({
  controllers: [GiteaBridgesController],
  providers: [GiteaBridgesService],
})
export class GiteaBridgesModule {}
