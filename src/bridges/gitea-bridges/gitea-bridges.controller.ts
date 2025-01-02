import { Controller, Post, Body } from '@nestjs/common';
import { GiteaBridgesService } from './gitea-bridges.service';

@Controller('bridges/gitea')
export class GiteaBridgesController {
  constructor(private readonly giteaBridgesService: GiteaBridgesService) {}

  @Post('/webhook')
  async dealWebhook(@Body() body: any): Promise<string> {
    return this.giteaBridgesService.dealWebhook(body);
  }
}
