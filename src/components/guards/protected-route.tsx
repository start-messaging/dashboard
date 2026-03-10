import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/common/full-page-spinner';
import { ROUTES } from '@/lib/constants';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to={ROUTES.SIGN_IN} replace />;

  return <Outlet />;
}
