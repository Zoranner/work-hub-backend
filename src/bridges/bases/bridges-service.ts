import { Logger, OnModuleInit } from '@nestjs/common';
import {
  AppServiceRegistration,
  Bridge,
  BridgeContext,
  EncryptedIntent,
  Intent,
  Request,
  WeakEvent,
} from 'matrix-appservice-bridge';
import { BridgeConfig } from './bridge.config';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import { EncryptionStore } from './encryption-store';
import { Repository } from 'typeorm';
import { EncryptionSession } from './entities/encryption-session.entity';
import { ClientEncryptionSession, ClientEncryptionStore } from 'matrix-appservice-bridge';

export abstract class BridgesService implements OnModuleInit {
  protected readonly appId: string;
  protected readonly displayName: string;
  protected bridge: Bridge;
  protected config: BridgeConfig;
  protected readonly logger = new Logger(BridgesService.name);

  // 添加简单的内存存储
  private encryptionSessions = new Map<string, ClientEncryptionSession>();

  constructor(
    appId: string,
    protected sessionRepository: Repository<EncryptionSession>,
  ) {
    this.appId = appId;
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const configPath = path.join(process.cwd(), 'configs', `${this.appId}.config.json`);
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        this.config = JSON.parse(configContent);
        this.logBridgeMessage(`config loaded`);
      } else {
        this.logBridgeWarn(`config not found`);
        this.config = {
          enabled: false,
        };
      }
    } catch (error) {
      this.logBridgeError(`config load failed: ${error.message}`);
      throw error;
    }
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logBridgeMessage(`disabled`);
      return;
    }

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
            regex: `@${this.appId}_.*:${this.config.homeserver.domain}`,
          },
        ],
        rooms: [
          {
            exclusive: true,
            regex: `#${this.appId}_.*:${this.config.homeserver.domain}`,
          },
        ],
        aliases: [],
      },
    });

    this.bridge = new Bridge({
      homeserverUrl: this.config.homeserver.url,
      domain: this.config.homeserver.domain,
      registration,
      bridgeEncryption: {
        homeserverUrl: 'https://pantalaimon.rd.kim',
        store: this.createEncryptionStore(),
      },
      controller: {
        onUserQuery: (userQuery: any) => {
          const userId = userQuery.userId;
          this.logBridgeMessage(`received user query request: ${userId}`);
          if (userId === `@${this.appId}:${this.config.homeserver.domain}`) {
            return {
              name: this.appId,
              display_name: this.config.displayName,
            };
          }
          return null;
        },
        onEvent: async (request: Request<WeakEvent>, context: BridgeContext) => {
          console.log(JSON.stringify(request));
          console.log(JSON.stringify(context));
          const event = request.getData();
          const bot = this.bridge.getBot();
          const intent = this.bridge.getIntent();
          console.log(JSON.stringify(event));
          // 处理房间成员事件
          if (
            event.type === 'm.room.member' &&
            event.content.membership === 'invite' &&
            event.state_key === `@${this.appId}:${this.config.homeserver.domain}`
          ) {
            await intent.join(event.room_id);
            this.sendMessage(intent, event.room_id, `Joined room ${event.room_id}`, true);
            this.logBridgeMessage(`joined room ${event.room_id}`);
          }

          // 处理加密消息
          if (event.type === 'm.room.encrypted') {
            this.logBridgeMessage(`received encrypted message from ${event.sender} in room ${event.room_id}`);
            this.sendMessage(
              intent,
              event.room_id,
              `received encrypted message from ${event.sender} in room ${event.room_id}`,
              true,
            );
          }

          // 处理消息事件
          if (event.type === 'm.room.message') {
            this.logBridgeMessage(`received message: ${JSON.stringify(event.content)}`);
            this.sendMessage(intent, event.room_id, `received message from ${event.sender} in room ${event.room_id}`, false);
          }
        },
      },
    });

    await this.bridge.initialise();
    this.logBridgeMessage(`initialized`);

    try {
      const intent = this.bridge.getIntent();
      await intent.ensureRegistered();
      this.logBridgeMessage(`user(@${this.appId}:${this.config.homeserver.domain}) registered`);
      await intent.setDisplayName(`${this.config.displayName} 助手`);
    } catch (error) {
      this.logBridgeError(`register bot user failed: ${error.message}`);
      throw error;
    }

    await this.bridge.run(this.config.port);
    this.logBridgeMessage(`started on port ${this.config.port}`);
  }

  protected async handleMessage(roomId: string, sender: string, content: string) {
    // 在这里实现具体的消息处理逻辑
    this.logBridgeMessage(`handling message from ${sender} in room ${roomId}: ${content}`);
  }

  async sendMessage(intent: Intent | EncryptedIntent, roomId: string, content: string, markdown: boolean = false) {
    try {
      const client = intent.matrixClient;

      // 准备消息内容
      let messageContent;
      if (markdown) {
        const htmlContent = marked(content);
        messageContent = {
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body: htmlContent,
          body: content,
        };
      } else {
        messageContent = {
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body: content,
          body: content.replace(/<[^>]*>/g, ''),
        };
      }

      // 直接使用 sendMessage 方法发送消息
      // SDK 会自动处理加密逻辑
      const eventId = await client.sendMessage(roomId, messageContent);
      this.logBridgeMessage(`消息已发送: ${eventId}`);
      return eventId;
    } catch (error) {
      this.logBridgeError(`发送消息失败: ${error.message}`);
      throw error;
    }
  }

  async dealWebhook(_body: any): Promise<string> {
    return undefined;
  }

  protected logBridgeMessage(message: string) {
    this.logger.log(`${BridgesService.name} ${this.appId}-bridge ${message}`);
  }

  protected logBridgeWarn(message: string) {
    this.logger.warn(`${BridgesService.name} ${this.appId}-bridge ${message}`);
  }

  protected logBridgeError(message: string) {
    this.logger.error(`${BridgesService.name} ${this.appId}-bridge ${message}`);
  }

  // 修改 EncryptionStore
  private createEncryptionStore(): ClientEncryptionStore {
    return {
      getStoredSession: async (userId: string) => {
        return this.encryptionSessions.get(userId) || null;
      },
      setStoredSession: async (session: ClientEncryptionSession) => {
        this.logBridgeMessage(`设置加密会话: ${session.userId}, ${session.deviceId}`);
        this.encryptionSessions.set(session.userId, session);
      },
      updateSyncToken: async () => {
        // 不需要实现
      },
    };
  }
}
