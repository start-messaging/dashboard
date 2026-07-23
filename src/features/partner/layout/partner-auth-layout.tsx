import { Outlet } from "react-router-dom";
import { AppIcon } from "@/components/ui/app-icon";

/** Centered shell for the partner login / register pages. */
export function PartnerAuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-xl font-bold">
        <AppIcon className="h-8 w-8 text-primary" stroke="currentColor" />
        <span>StartMessaging</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Affiliate
        </span>
      </div>
      <Outlet />
    </div>
  );
}
