import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute } from '@/components/guards/guest-route';
import { ProtectedRoute } from '@/components/guards/protected-route';
import {
  RequireNotOnboarded,
  RequireOnboarding,
} from '@/components/guards/onboarding-guard';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { SignInPage } from '@/pages/signIn';
import { OnboardingPage } from '@/pages/onboarding';
import { DashboardPage } from '@/pages/dashboard';
import { TransactionsPage } from '@/pages/transactions';
import { ApiKeysPage } from '@/pages/api-keys';
import { ApiDocsPage } from '@/pages/api-docs';
import { MessagesPage } from '@/pages/messages';
import { useReferralCapture } from '@/hooks/useReferralCapture';
import { ROUTES } from '@/lib/constants';

export default function App() {
  // Runs above the router outlet so a referral link lands anywhere in the app
  // and still attributes — including straight onto the sign-in page, which is
  // where most referral traffic actually arrives.
  useReferralCapture();

  return (
    <Routes>
      {/* Public */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
        </Route>
      </Route>

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RequireNotOnboarded />}>
          <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
        </Route>
        <Route element={<RequireOnboarding />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.API_KEYS} element={<ApiKeysPage />} />
            <Route path={ROUTES.API_DOCS} element={<ApiDocsPage />} />
            <Route path={ROUTES.TRANSACTIONS} element={<TransactionsPage />} />
            <Route path={ROUTES.MESSAGES} element={<MessagesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
