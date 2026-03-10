import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

export function RequireOnboarding() {
  const { user } = useAuth();

  if (user && !user.hasCompletedOnboarding) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }

  return <Outlet />;
}

export function RequireNotOnboarded() {
  const { user } = useAuth();

  if (user && user.hasCompletedOnboarding) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
