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
import { ROUTES } from '@/lib/constants';

export default function App() {
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
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
