import { Navigate, Outlet } from "react-router-dom";
import { FullPageSpinner } from "@/components/common/full-page-spinner";
import { ROUTES } from "@/lib/constants";
import { usePartnerAuth } from "../hooks/use-partner-auth";

/** Keeps an already-signed-in partner out of the login/register pages. */
export function PartnerGuestRoute() {
  const { isAuthenticated, isLoading } = usePartnerAuth();

  if (isLoading) return <FullPageSpinner />;
  if (isAuthenticated) return <Navigate to={ROUTES.PARTNER} replace />;

  return <Outlet />;
}
