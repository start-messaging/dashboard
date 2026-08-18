import type { User } from './user';

export interface AuthResponse {
  accessToken: string;
  user: User;
  /**
   * Present (true) only when /auth/google just created the account.
   * Existing-account sign-ins omit it or send false. Drives the
   * alias-vs-identify decision in useAuth's analytics wiring.
   */
  isNewUser?: boolean;
}

export interface GoogleAuthPayload {
  idToken: string;
  country?: string;
}
