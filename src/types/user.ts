export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'customer' | 'referrer';
  mobileNumber: string | null;
  companyName: string | null;
  websiteUrl: string | null;
  hasCompletedOnboarding: boolean;
  isActive: boolean;
  country: string | null;
  kycStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  mobileVerified: boolean;
  businessName: string | null;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  companyName?: string;
  websiteUrl?: string;
  country?: string;
}
