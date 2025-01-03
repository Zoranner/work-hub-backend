export interface BridgeConfig {
  enabled: boolean;
  port?: number;
  displayName?: string;
  bridge?: {
    url: string;
  };
  tokens?: {
    as_token: string;
    hs_token: string;
  };
  homeserver?: {
    url: string;
    domain: string;
  };
} 