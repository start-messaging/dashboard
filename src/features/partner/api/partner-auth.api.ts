import { partnerGet, partnerPost } from "./partner-client";
import type {
  PartnerAuthResponse,
  PartnerLoginInput,
  PartnerProfile,
  PartnerRegisterInput,
} from "@/types";

export function partnerRegister(
  input: PartnerRegisterInput,
): Promise<PartnerAuthResponse> {
  return partnerPost<PartnerAuthResponse>("/partner/auth/register", input);
}

export function partnerLogin(
  input: PartnerLoginInput,
): Promise<PartnerAuthResponse> {
  return partnerPost<PartnerAuthResponse>("/partner/auth/login", input);
}

export function partnerMe(): Promise<PartnerProfile> {
  return partnerGet<PartnerProfile>("/partner/auth/me");
}

export function partnerLogout(): Promise<void> {
  return partnerPost<void>("/partner/auth/logout");
}
