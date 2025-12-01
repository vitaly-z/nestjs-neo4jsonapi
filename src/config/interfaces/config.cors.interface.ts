export interface ConfigCorsInterface {
  origins: string[];
  originPatterns: string[];
  credentials: boolean;
  methods: string;
  allowedHeaders: string;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
  logViolations: boolean;
}
