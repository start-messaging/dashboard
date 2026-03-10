import { apiGet, apiPost } from './api-client';
import type { User } from '@/types';

export function sendMobileOtp(mobileNumber: string) {
  return apiPost<{ sent: boolean; message: string }>(
    '/users/send-mobile-otp',
    { mobileNumber },
  );
}

export function verifyMobileOtp(otp: string) {
  return apiPost<User>('/users/verify-mobile-otp', { otp });
}

export function submitKyc(formData: FormData) {
  return apiPost<User>('/users/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export interface OnboardingStatus {
  currentStep: number;
  isComplete: boolean;
  steps: { step: number; title: string; completed: boolean }[];
}

export function getOnboardingStatus() {
  return apiGet<OnboardingStatus>('/users/onboarding-status');
}
