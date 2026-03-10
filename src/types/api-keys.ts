export interface ApiKey {
  id: string;
  keyPrefix: string;
  label: string;
  isActive: boolean;
  allowedIps: string[] | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface LanguageExamples {
  curl: string;
  nodejs: string;
  python: string;
  php: string;
  java: string;
  go: string;
}

export interface EndpointExample {
  title: string;
  description: string;
  endpoint: string;
  languages: LanguageExamples;
}

export interface UsageGuideResponse {
  baseUrl: string;
  authentication: { header: string; description: string };
  examples: Record<string, EndpointExample>;
}

export interface CreateApiKeyResponse {
  id: string;
  key: string;
  keyPrefix: string;
  label: string;
  allowedIps: string[] | null;
  createdAt: string;
  codeExamples: {
    sendOtp: LanguageExamples;
  };
}
