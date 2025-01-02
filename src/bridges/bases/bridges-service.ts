import { Logger, OnModuleInit } from '@nestjs/common';
import { AppServiceRegistration, Bridge } from 'matrix-appservice-bridge';
import { BridgeConfig } from './bridge.config';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';

export abstract class BridgesService implements OnModuleInit {
  protected readonly appId: string;
  protected bridge: Bridge;
  protected config: BridgeConfig;
  protected readonly logger = new Logger(BridgesService.name);

  constructor(appId: string) {
    this.appId = appId;
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const configPath = path.join(process.cwd(), 'configs', `${this.appId}.config.json`);
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        this.config = JSON.parse(configContent);
        this.logger.log(`已加载 ${this.appId} 的配置文件`);
      } else {
        this.logger.warn(`未找到 ${this.appId} 的配置文件`);
        this.config = {
          enabled: false,
        };
      }
    } catch (error) {
      this.logger.error(`加载配置文件失败: ${error.message}`);
      throw error;
    }
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logger.log(`应用服务 ${this.appId}-bridge 已禁用`);
      return;
    }

    console.log(JSON.stringify(this.config));

    // 创建注册信息
    const registration = AppServiceRegistration.fromObject({
      id: `${this.appId}-bridge`,
      url: this.config.bridge.url,
      as_token: this.config.tokens.as_token,
      hs_token: this.config.tokens.hs_token,
      sender_localpart: this.appId,
      namespaces: {
        users: [
          {
            exclusive: true,
            regex: `@${this.appId}:${this.config.homeserver.domain}`,
          },
        ],
        rooms: [
          {
            exclusive: true,
            regex: `@${this.appId}:${this.config.homeserver.domain}`,
          },
        ],
        aliases: [],
      },
    });

    this.bridge = new Bridge({
      homeserverUrl: this.config.homeserver.url,
      domain: this.config.homeserver.domain,
      registration,
      controller: {
        onUserQuery: (_user: any) => {
          return {};
        },
        onEvent: async (request: any, context: any) => {
          const event = request.getData();
          if (
            event.type === 'm.room.member' &&
            event.content.membership === 'invite' &&
            event.state_key === `@${this.appId}:${this.config.homeserver.domain}`
          ) {
            await this.bridge.getIntent().join(event.room_id);
          }
        },
      },
    } as any);

    // 使用配置的端口启动 bridge
    await this.bridge.run(this.config.port);
    this.logger.log(`Bridge service started on port ${this.config.port}...`);
  }

  async sendMessage(roomId: string, content: string, markdown: boolean = false) {
    try {
      const intent = this.bridge.getIntent();

      if (markdown) {
        // 将 Markdown 转换为 HTML
        const htmlContent = marked(content);
        await intent.sendMessage(roomId, {
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body: htmlContent,
          body: content,
        });
      } else {
        await intent.sendMessage(roomId, {
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body: content,
          body: content.replace(/<[^>]*>/g, ''),
        });
      }
    } catch (error) {
      this.logger.error(`发送消息失败: ${error.message}`);
      throw error;
    }
  }

  async dealWebhook(_body: any): Promise<string> {
    return undefined;
  }
}
