import { Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { usePartnerAuth } from "../hooks/use-partner-auth";

/**
 * The partner portal shell — deliberately its own chrome (not the customer
 * sidebar). Header with brand + partner identity + sign out, then the routed
 * page. Kept self-contained so the whole `features/partner` tree can later be
 * lifted into a standalone app / subdomain.
 */
export function PartnerLayout() {
  const { partner, logout } = usePartnerAuth();

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <AppIcon className="h-7 w-7 text-primary" stroke="currentColor" />
            <span>StartMessaging</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Affiliate Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            {partner && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {partner.fullName}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
