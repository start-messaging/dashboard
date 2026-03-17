import { useState } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ApiKeysPage() {
  const { data: keys, isLoading: keysLoading } = useApiKeys();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Key className="size-5" />
        <h1 className="text-2xl font-bold">API Keys</h1>
      </div>

      <ApiKeysSection keys={keys ?? []} isLoading={keysLoading} />
      
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Looking for code examples and testing tools? 
            <Button variant="link" className="px-1" asChild>
              <a href="/api-docs">View API Docs & Testing &rarr;</a>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeysSection({
  keys,
  isLoading,
}: {
  keys: any[];
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Your Keys
        </h2>
        <CreateKeyDialog />
      </div>

      {isLoading ? (
        <KeysLoadingSkeleton />
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground border rounded-lg bg-muted/20">
          <Inbox className="size-10" />
          <p className="text-sm">
            No API keys yet. Create one to get started.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Key Prefix</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <ApiKeyRow key={k.id} apiKey={k} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ApiKeyRow({
  apiKey,
}: {
  apiKey: any;
}) {
  const deleteKey = useDeleteApiKey();

  return (
    <TableRow>
      <TableCell className="font-medium">
        {apiKey.label || (
          <span className="text-muted-foreground italic">No label</span>
        )}
      </TableCell>
      <TableCell>
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          {apiKey.keyPrefix}...
        </code>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(apiKey.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {apiKey.lastUsedAt
          ? new Date(apiKey.lastUsedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Never"}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (confirm("Are you sure you want to delete this key?")) {
              deleteKey.mutate(apiKey.id);
            }
          }}
          disabled={deleteKey.isPending}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function CreateKeyDialog() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const createKey = useCreateApiKey();

  const handleCreate = () => {
    createKey.mutate(label, {
      onSuccess: (data) => {
        setCreatedKey(data.key);
        setShowKey(true);
      },
    });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setLabel("");
      setCreatedKey(null);
      setShowKey(false);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Copy your key now. You won't be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
                  {showKey
                    ? createdKey
                    : createdKey.slice(0, 12) + "\u2022".repeat(Math.max(0, createdKey.length - 12))}
                </code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
                <CopyButton text={createdKey} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Give your key a label to identify it later.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="e.g. Production Key"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={createKey.isPending}
              >
                {createKey.isPending ? "Creating..." : "Create Key"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
      {copied ? (
        <Check className="size-4 text-emerald-600" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
}

function KeysLoadingSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead>Key Prefix</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Used</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
