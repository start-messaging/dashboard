import { Navigate, Outlet } from "react-router-dom";
import { FullPageSpinner } from "@/components/common/full-page-spinner";
import { ROUTES } from "@/lib/constants";
import { usePartnerAuth } from "../hooks/use-partner-auth";

/** Gate for the partner portal — bounces to the partner login if not signed in. */
export function RequirePartnerAuth() {
  const { isAuthenticated, isLoading } = usePartnerAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to={ROUTES.PARTNER_LOGIN} replace />;

  return <Outlet />;
}
