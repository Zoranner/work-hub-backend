import { Logger, OnModuleInit } from '@nestjs/common';
import {
  Appservice,
  IAppserviceRegistration,
  MatrixClient,
  LogService,
  RichConsoleLogger,
  SimpleFsStorageProvider,
  AutojoinRoomsMixin,
  LogLevel,
  RustSdkAppserviceCryptoStorageProvider,
  MessageEvent,
  SimpleRetryJoinStrategy,
} from '@vector-im/matrix-bot-sdk';
import { StoreType } from '@matrix-org/matrix-sdk-crypto-nodejs';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import { BridgeConfig } from './bridge.config';

export abstract class BridgesService implements OnModuleInit {
  protected readonly appId: string;
  protected appservice: Appservice;
  protected botClient: MatrixClient;
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
    const registration: IAppserviceRegistration = {
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
      protocols: [],
      rate_limited: false,
      'de.sorunome.msc2409.push_ephemeral': true,
    };

    try {
      // 设置存储
      const storage = new SimpleFsStorageProvider(path.join(process.cwd(), 'storage', this.appId));

      // 确保加密存储目录存在
      const cryptoPath = path.join(process.cwd(), 'data', 'crypto', this.appId);
      if (!fs.existsSync(cryptoPath)) {
        fs.mkdirSync(cryptoPath, { recursive: true });
      }

      // 设置加密存储
      const cryptoStore = new RustSdkAppserviceCryptoStorageProvider(cryptoPath, StoreType.Sqlite);

      // 设置日志
      LogService.setLogger(new RichConsoleLogger());
      LogService.setLevel(LogLevel.DEBUG);

      // 创建 Appservice
      this.appservice = new Appservice({
        port: this.config.port,
        bindAddress: '0.0.0.0',
        homeserverUrl: this.config.homeserver.url,
        homeserverName: this.config.homeserver.domain,
        storage: storage,
        registration: registration,
        cryptoStorage: cryptoStore,
        joinStrategy: new SimpleRetryJoinStrategy(),
        intentOptions: {
          encryption: true,
        },
      });

      // 获取 bot client
      this.botClient = this.appservice.botIntent.underlyingClient;
      await this.appservice.botIntent.enableEncryption();
      AutojoinRoomsMixin.setupOnClient(this.botClient);

      // 设置事件处理
      this.appservice.on('room.message', this.handleMessage.bind(this));
      this.appservice.on('room.encrypted', this.handleEncryptedMessage.bind(this));
      this.appservice.on('room.join', this.handleJoin.bind(this));
      this.appservice.on('room.failed_decryption', this.handleFailedDecryption.bind(this));
      this.appservice.on('query.user', this.handleUserQuery.bind(this));
      this.appservice.on('query.key', this.handleKeyQuery.bind(this));
      this.appservice.on('query.key_claim', this.handleKeyClaimQuery.bind(this));

      // 启动服务
      await this.appservice.begin();
      this.logBridgeMessage(`started on port ${this.config.port}`);

      // 设置机器人显示名称
      await this.botClient.setDisplayName(`${this.config.displayName} 助手`);
      this.logBridgeMessage(`display name set to ${this.config.displayName} 助手`);
    } catch (error) {
      this.logBridgeError(`start bridge failed: ${error.message}`);
      throw error;
    }
  }

  protected async handleMessage(roomId: string, event: any) {
    if (event.sender === (await this.botClient.getUserId())) {
      return;
    }

    const message = new MessageEvent(event);
    if (message.messageType === 'm.text') {
      this.logBridgeMessage(`handling message from ${event.sender} in room ${roomId}: ${message.textBody}`);
      await this.processMessage(roomId, event.sender, message.textBody);
    }
  }

  protected async handleEncryptedMessage(roomId: string, event: any) {
    if (event.sender === (await this.botClient.getUserId())) {
      return;
    }

    try {
      const message = new MessageEvent(event);
      if (message.messageType === 'm.text') {
        this.logBridgeMessage(`handling encrypted message from ${event.sender} in room ${roomId}: ${message.textBody}`);
        await this.processMessage(roomId, event.sender, message.textBody);
      }
    } catch (error) {
      this.logBridgeError(`handle encrypted message failed: ${error.message}`);
    }
  }

  protected async handleFailedDecryption(roomId: string, event: any, error: Error) {
    this.logBridgeError(`Failed to decrypt message in room ${roomId}: ${error.message}`);
  }

  protected async handleKeyQuery(req: any, done: (response: any) => void) {
    this.logBridgeMessage(`Key query request: ${JSON.stringify(req)}`);
    done({});
  }

  protected async handleKeyClaimQuery(req: any, done: (response: any) => void) {
    this.logBridgeMessage(`Key claim request: ${JSON.stringify(req)}`);
    done({});
  }

  protected async processMessage(roomId: string, sender: string, content: string) {
    // 子类实现具体的消息处理逻辑
  }

  protected async handleJoin(roomId: string, event: any) {
    this.logBridgeMessage(`joined room ${roomId}`);
    await this.sendMessage(roomId, `已加入房间 ${roomId}`, true);

    // 如果是加密房间，确保启用加密
    if (await this.botClient.crypto.isRoomEncrypted(roomId)) {
      await this.botClient.crypto.prepare();
    }
  }

  protected async handleUserQuery(userId: string) {
    this.logBridgeMessage(`received user query: ${userId}`);
    if (userId === `@${this.appId}:${this.config.homeserver.domain}`) {
      return {
        name: this.appId,
        display_name: this.config.displayName,
      };
    }
    return null;
  }

  async sendMessage(roomId: string, content: string, markdown: boolean = false) {
    try {
      let messageContent: any;
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

      const eventId = await this.botClient.sendMessage(roomId, messageContent);
      this.logBridgeMessage(`message sent: ${eventId}`);
      return eventId;
    } catch (error) {
      this.logBridgeError(`send message failed: ${error.message}`);
      throw error;
    }
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
}
