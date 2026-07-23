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
import { TemplatesPage } from '@/pages/templates';
import { PartnerAuthLayout } from '@/features/partner/layout/partner-auth-layout';
import { PartnerLayout } from '@/features/partner/layout/partner-layout';
import { PartnerGuestRoute } from '@/features/partner/guards/partner-guest-route';
import { RequirePartnerAuth } from '@/features/partner/guards/require-partner-auth';
import { PartnerLoginPage } from '@/features/partner/pages/partner-login';
import { PartnerRegisterPage } from '@/features/partner/pages/partner-register';
import { PartnerDashboardPage } from '@/features/partner/pages/partner-dashboard';
import { ROUTES } from '@/lib/constants';

export default function App() {
  return (
    <Routes>
      {/* Public (customer) */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
        </Route>
      </Route>

      {/* Protected (customer) */}
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
            <Route path={ROUTES.TEMPLATES} element={<TemplatesPage />} />
          </Route>
        </Route>
      </Route>

      {/* Partner portal — its own auth + shell, independent of the customer app */}
      <Route element={<PartnerGuestRoute />}>
        <Route element={<PartnerAuthLayout />}>
          <Route path={ROUTES.PARTNER_LOGIN} element={<PartnerLoginPage />} />
          <Route
            path={ROUTES.PARTNER_REGISTER}
            element={<PartnerRegisterPage />}
          />
        </Route>
      </Route>
      <Route element={<RequirePartnerAuth />}>
        <Route element={<PartnerLayout />}>
          <Route path={ROUTES.PARTNER} element={<PartnerDashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
