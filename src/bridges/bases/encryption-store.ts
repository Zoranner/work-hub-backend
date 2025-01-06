import { Repository } from 'typeorm';
import { ClientEncryptionSession, ClientEncryptionStore } from 'matrix-appservice-bridge';
import { EncryptionSession } from './entities/encryption-session.entity';

export class EncryptionStore implements ClientEncryptionStore {
  constructor(private sessionRepository: Repository<EncryptionSession>) {}

  async getStoredSession(userId: string): Promise<ClientEncryptionSession | null> {
    const session = await this.sessionRepository.findOne({ where: { userId } });
    if (!session) {
      return null;
    }
    return {
      userId: session.userId,
      deviceId: session.deviceId,
      accessToken: session.accessToken,
      syncToken: session.syncToken,
    };
  }

  async setStoredSession(session: ClientEncryptionSession): Promise<void> {
    await this.sessionRepository.save({
      userId: session.userId,
      deviceId: session.deviceId,
      accessToken: session.accessToken,
      syncToken: session.syncToken,
    });
  }

  async updateSyncToken(userId: string, token: string): Promise<void> {
    await this.sessionRepository.update({ userId }, { syncToken: token });
  }
}
