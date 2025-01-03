import { Module } from '@nestjs/common';
import { GiteaBridgesController } from './gitea-bridges.controller';
import { GiteaBridgesService } from './gitea-bridges.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionSession } from '../bases/entities/encryption-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EncryptionSession])],
  controllers: [GiteaBridgesController],
  providers: [GiteaBridgesService],
  exports: [GiteaBridgesService],
})
export class GiteaBridgesModule {}
