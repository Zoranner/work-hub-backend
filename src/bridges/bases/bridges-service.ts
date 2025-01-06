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
import { ClientEncryptionStore } from 'matrix-appservice-bridge';

export abstract class BridgesService implements OnModuleInit {
  protected readonly appId: string;
  protected readonly displayName: string;
  protected bridge: Bridge;
  protected config: BridgeConfig;
  protected readonly logger = new Logger(BridgesService.name);

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

    // 配置 bridge
    const bridgeOpts = {
      homeserverUrl: this.config.homeserver.url,
      domain: this.config.homeserver.domain,
      registration,
      controller: {
        onEvent: this.onEvent.bind(this),
        onUserQuery: this.onUserQuery.bind(this),
      },
      cryptoStore: this.createEncryptionStore(),
      enableCrypto: true,
      cryptoRunInProcess: true,
    };

    try {
      this.bridge = new Bridge(bridgeOpts);
      await this.bridge.initialise();

      const intent = this.bridge.getIntent();
      await intent.ensureRegistered();
      this.logBridgeMessage(`user(@${this.appId}:${this.config.homeserver.domain}) registered`);
      await intent.setDisplayName(`${this.config.displayName} 助手`);

      await this.bridge.run(this.config.port);
      this.logBridgeMessage(`started on port ${this.config.port}`);
    } catch (error) {
      this.logBridgeError(`start bridge failed: ${error.message}`);
      throw error;
    }
  }

  protected async handleMessage(roomId: string, sender: string, content: string) {
    this.logBridgeMessage(`handling message from ${sender} in room ${roomId}: ${content}`);
  }

  async sendMessage(intent: Intent | EncryptedIntent, roomId: string, content: string, markdown: boolean = false) {
    try {
      const client = intent.matrixClient;
      // 准备消息内容
      let messageContent: { msgtype: string; format?: string; formatted_body?: string; body: string };
      if (markdown) {
        const htmlContent = await marked(content);
        messageContent = {
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body: htmlContent,
          body: content,
        };
      } else {
        messageContent = {
          msgtype: 'm.text',
          body: content,
        };
      }

      // 发送消息
      const eventId = await client.sendMessage(roomId, messageContent);
      this.logBridgeMessage(`message sent: ${eventId}`);
      return eventId;
    } catch (error) {
      this.logBridgeError(`send message failed: ${error.message}`);
      throw error;
    }
  }

  protected async onEvent(request: Request<WeakEvent>, context: BridgeContext) {
    const event = request.getData();
    const intent = this.bridge.getIntent();

    try {
      // 处理房间成员事件
      if (
        event.type === 'm.room.member' &&
        event.content?.membership === 'invite' &&
        event.state_key === `@${this.appId}:${this.config.homeserver.domain}`
      ) {
        await intent.join(event.room_id);
        await this.sendMessage(intent, event.room_id, `Joined room ${event.room_id}`, true);
        this.logBridgeMessage(`joined room ${event.room_id}`);
        return;
      }

      // 处理加密消息
      if (event.type === 'm.room.encrypted') {
        this.logBridgeMessage(`received encrypted message from ${event.sender} in room ${event.room_id}`);

        const content = event.content;
        if (!content) {
          this.logBridgeWarn(`encrypted message content is empty`);
          return;
        }

        if (content.msgtype === 'm.text' && typeof content.body === 'string') {
          await this.handleMessage(event.room_id, event.sender, content.body);
        } else {
          this.logBridgeWarn(`unsupported encrypted message type: ${content.msgtype}`);
        }
        return;
      }

      // 处理普通消息
      if (event.type === 'm.room.message') {
        const content = event.content;
        if (content?.msgtype === 'm.text' && typeof content.body === 'string') {
          this.logBridgeMessage(`received message from ${event.sender} in room ${event.room_id}`);
          await this.handleMessage(event.room_id, event.sender, content.body);
        } else {
          this.logBridgeWarn(`unsupported message type: ${content?.msgtype}`);
        }
        return;
      }
    } catch (error) {
      this.logBridgeError(`handle event failed: ${error.message}`);
      throw error;
    }
  }

  protected onUserQuery(userQuery: { userId: string }) {
    const userId = userQuery.userId;
    this.logBridgeMessage(`received user query: ${userId}`);
    if (userId === `@${this.appId}:${this.config.homeserver.domain}`) {
      return {
        name: this.appId,
        display_name: this.config.displayName,
      };
    }
    return null;
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

  private createEncryptionStore(): ClientEncryptionStore {
    const store = new EncryptionStore(this.sessionRepository);
    return {
      getStoredSession: store.getStoredSession.bind(store),
      setStoredSession: store.setStoredSession.bind(store),
      updateSyncToken: store.updateSyncToken.bind(store),
    };
  }
}
