import { Outlet } from "react-router-dom";
import { Wallet } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AddMoneyDialog } from "@/components/add-money-dialog";
import { useWallet } from "@/hooks/useWallet";
import { formatINR } from "@/lib/utils";

function WalletBadge() {
  const { balance, isLoading } = useWallet();

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Wallet className="size-4 text-muted-foreground" />
      {isLoading ? (
        <Skeleton className="h-4 w-20" />
      ) : (
        <span className="font-medium">{formatINR(balance)}</span>
      )}
    </div>
  );
}

export function DashboardLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <div className="ml-auto flex items-center gap-3">
              <WalletBadge />
              <AddMoneyDialog />
            </div>
          </header>
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
