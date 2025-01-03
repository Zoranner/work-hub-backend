import { Injectable } from '@nestjs/common';
import { SynapseConfig } from '../../configs/synapse.config';
import { BridgesService } from '../bases/bridges-service';
import { Repository } from 'typeorm';
import { EncryptionSession } from '../bases/entities/encryption-session.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GiteaBridgesService extends BridgesService {
  constructor(
    @InjectRepository(EncryptionSession)
    protected sessionRepository: Repository<EncryptionSession>,
  ) {
    super('gitea', sessionRepository);
  }

  async dealWebhook(body: any): Promise<string> {
    let message: string;

    if (body.action == 'created') {
      message = `<font color="warning">${body.sender.full_name}</font> `;
      message += `创建了 [${body.repository.full_name}](${body.repository.html_url}) 仓库。`;
    } else if (body.action == 'deleted') {
      message = `<font color="warning">${body.sender.full_name}</font> `;
      message += `删除了 [${body.repository.full_name}](${body.repository.html_url}) 仓库。`;
    } else if (body.commits && body.commits.length > 0) {
      message = `<font color="warning">${body.sender.full_name}</font> `;
      let branch = body.ref.replace('refs/heads/', '');
      message += `推送了 [${branch}](${body.repository.html_url}/src/branch/${branch}) 分支`;
      message += `到 [${body.repository.full_name}](${body.repository.html_url}) 仓库，`;
      message += `更新了以下内容：\n>`;
      for (let index = 0; index < body.commits.length; index++) {
        let commit = body.commits[index];
        let subject = commit.message.split('\n')[0];
        message += `<font color=\"comment\">${subject}</font>`;
        if (index < body.commits.length) {
          message += `\n`;
        }
      }
    } else {
      return `Unknown: ${JSON.stringify(body)}`;
    }

    // 使用 bridge 发送消息
    // if (message && SynapseConfig.defaultRoomId) {
    //   await this.sendMessage(intent, SynapseConfig.defaultRoomId, message, true);
    // }

    return message;
  }
}
