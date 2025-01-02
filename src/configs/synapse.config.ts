export const SynapseConfig = {
  homeserverUrl: process.env.SYNAPSE_HOMESERVER_URL || 'http://localhost:8008',
  domain: process.env.MATRIX_DOMAIN || 'matrix.rd.kim',
  bridgeUrl: process.env.BRIDGE_URL || 'http://localhost:8090',
  asToken: process.env.SYNAPSE_AS_TOKEN || '',
  hsToken: process.env.SYNAPSE_HS_TOKEN || '',
  botUserId: process.env.SYNAPSE_BOT_USER_ID || '@gitea:matrix.rd.kim',
  defaultRoomId: process.env.SYNAPSE_DEFAULT_ROOM_ID || '',
};
