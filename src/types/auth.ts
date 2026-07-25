import type { User } from "./user";

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface GoogleAuthPayload {
  idToken: string;
  country?: string;
  /** Affiliate referral code captured from a ?ref= link on the sign-in URL. */
  referralCode?: string;
}
