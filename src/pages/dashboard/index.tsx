import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Welcome{user?.firstName ? `, ${user.firstName}` : ''}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Messages Sent', 'Delivered', 'Failed', 'Wallet Balance'].map(
          (label) => (
            <div key={label} className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">--</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
