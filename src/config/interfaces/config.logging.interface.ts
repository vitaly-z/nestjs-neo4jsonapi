export interface ConfigLoggingInterface {
  loki: ConfigLokiInterface;
}

export interface ConfigLokiInterface {
  enabled: boolean;
  host: string;
  username: string;
  password: string;
  batching: boolean;
  interval: number;
  labels: {
    application: string;
    environment: string;
  };
}
