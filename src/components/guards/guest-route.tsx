import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/common/full-page-spinner';
import { ROUTES } from '@/lib/constants';

export function GuestRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <FullPageSpinner />;

  if (isAuthenticated) {
    const target = user?.hasCompletedOnboarding
      ? ROUTES.DASHBOARD
      : ROUTES.ONBOARDING;
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
