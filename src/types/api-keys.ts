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

export interface CreateApiKeyPayload {
  label: string;
  /**
   * Omitted entirely when the key is unrestricted. An empty array would mean the
   * same thing to the server — it normalises `[]` to NULL — but sending the
   * field only when it carries addresses keeps "unrestricted" one spelling on
   * the wire instead of two.
   */
  allowedIps?: string[];
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

export interface MyIpResponse {
  ip: string;
}
