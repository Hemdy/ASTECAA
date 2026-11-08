export type EnvironmentName = 'development' | 'test' | 'staging' | 'production';

export interface ServiceEndpoints {
  website: string;
  admin: string;
  api: string;
}

export interface AstecAppConfig {
  env: EnvironmentName;
  services: ServiceEndpoints;
  allowedOrigins: string[];
}

export interface WindowAstecConfig {
  env?: EnvironmentName;
  services?: Partial<ServiceEndpoints>;
}

declare global {
  var __ASTECAA_CONFIG__: WindowAstecConfig | undefined;
  var __ASTECAA_API_URL__: string | undefined;
}

