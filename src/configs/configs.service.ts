import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Config } from './entities/config.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConfigsService implements OnModuleInit {

  constructor(
    @InjectRepository(Config)
    private readonly configsRepository: Repository<Config>,
  ) {}

  async onModuleInit() {
    let config = await this.configsRepository.findOneBy({ id: 1 });
    if (!config) {
      config = new Config();
    }
    if (config.installed) {
      return;
    }
    config.installed = true;
    await this.configsRepository.save(config);
  }
}
