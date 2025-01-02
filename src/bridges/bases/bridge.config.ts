export interface BridgeConfig {
  enabled: boolean;
  port?: number;
  tokens?: {
    as_token: string;
    hs_token: string;
  };
  homeserver?: {
    url: string;
    domain: string;
  };
  bridge?: {
    url: string;
  };
} 