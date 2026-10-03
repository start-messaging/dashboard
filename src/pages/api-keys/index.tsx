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
  Globe,
  ShieldCheck,
  X,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useMyIp,
  useUpdateApiKeyIps,
} from "@/hooks/useApiKeys";
import { getApiErrorMessage } from "@/lib/api-error";
import { isIpAddress, MAX_ALLOWED_IPS } from "@/lib/ip";
import type { ApiKey } from "@/types/api-keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
              <a href="/api-docs">View API Docs &amp; Testing &rarr;</a>
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
  keys: ApiKey[];
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
              <TableHead>IP Restrictions</TableHead>
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
  const deleteKey = useDeleteApiKey();
  const allowed = apiKey.allowedIps ?? [];

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
      <TableCell>
        {/* The restriction state is a column rather than something you have to
            open a dialog to discover: a key that has stopped working because its
            allow list no longer matches the caller is refused with a generic
            "Authentication required", so this list is the only place the real
            answer is visible. */}
        {allowed.length === 0 ? (
          <span className="text-muted-foreground text-sm">Any IP</span>
        ) : (
          <Badge variant="outline" title={allowed.join("\n")}>
            <ShieldCheck />
            {allowed.length === 1
              ? allowed[0]
              : `${allowed.length} addresses`}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(apiKey.createdAt)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : "Never"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <IpRestrictionsDialog apiKey={apiKey} />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete API key"
            onClick={() => {
              if (confirm("Are you sure you want to delete this key?")) {
                deleteKey.mutate(apiKey.id);
              }
            }}
            disabled={deleteKey.isPending}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * The add/remove surface for one key's allow list.
 *
 * Shared by the create dialog and the edit dialog so that the rules a customer
 * meets — what counts as an address, where the cap is, what an empty list means
 * — are stated once and cannot drift between the two places you can set them.
 */
function IpListEditor({
  value,
  onChange,
  myIp,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  myIp?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = (raw: string) => {
    const candidate = raw.trim();
    if (!candidate) return;

    if (!isIpAddress(candidate)) {
      setError(
        candidate.includes("/")
          ? "Ranges are not supported — add each address on its own."
          : "Enter a single IPv4 or IPv6 address.",
      );
      return;
    }
    if (value.includes(candidate)) {
      setError("That address is already on the list.");
      return;
    }
    if (value.length >= MAX_ALLOWED_IPS) {
      setError(`A key can be restricted to at most ${MAX_ALLOWED_IPS} addresses.`);
      return;
    }

    onChange([...value, candidate]);
    setDraft("");
    setError(null);
  };

  const atCap = value.length >= MAX_ALLOWED_IPS;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1">
          <Input
            placeholder="e.g. 203.0.113.5"
            value={draft}
            disabled={disabled || atCap}
            aria-label="IP address"
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // The editor sits inside a dialog whose default submit would
                // save the whole form; adding an address must not do that.
                e.preventDefault();
                add(draft);
              }
            }}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || atCap || !draft.trim()}
          onClick={() => add(draft)}
        >
          Add
        </Button>
      </div>

      {myIp && !value.includes(myIp) && !atCap && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          disabled={disabled}
          onClick={() => add(myIp)}
        >
          <Globe />
          Add this browser's address ({myIp})
        </Button>
      )}

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((ip) => (
            <li key={ip}>
              <Badge variant="secondary" className="h-7 pr-1 font-mono">
                {ip}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${ip}`}
                  disabled={disabled}
                  onClick={() => onChange(value.filter((v) => v !== ip))}
                >
                  <X />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No restrictions — this key works from any IP address.
        </p>
      )}

      {value.length > 0 && (
        <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          <TriangleAlert className="size-4 shrink-0 text-amber-600" />
          {/* The guard's 403 is discarded by CombinedAuthGuard, so a request
              from an address that is not on this list is refused as a bare 401
              "Authentication required" — the same answer a wrong key gets. A
              customer who lists the wrong address has no way to tell those two
              apart from the response, so the warning has to be here. */}
          <p>
            Calls from any other address will be rejected as{" "}
            <strong>Authentication required</strong> — the same error as an
            invalid key. List the address your <em>server</em> calls us from,
            which is usually not the one this browser is on.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length} of {MAX_ALLOWED_IPS} addresses used.
      </p>
    </div>
  );
}

function IpRestrictionsDialog({ apiKey }: { apiKey: ApiKey }) {
  const [open, setOpen] = useState(false);
  const [ips, setIps] = useState<string[]>(apiKey.allowedIps ?? []);
  const updateIps = useUpdateApiKeyIps();
  // Only asked for while the dialog is open, so the address shown is the one
  // this connection has right now rather than one cached from an earlier visit.
  const { data: myIp } = useMyIp(open);

  const save = () => {
    updateIps.mutate(
      { id: apiKey.id, allowedIps: ips.length > 0 ? ips : null },
      {
        onSuccess: () => {
          toast.success(
            ips.length > 0
              ? `Key restricted to ${ips.length} address${ips.length === 1 ? "" : "es"}`
              : "IP restrictions removed",
          );
          setOpen(false);
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    // Seeded as the dialog opens rather than synced by an effect: reopening
    // after a cancelled edit has to show what is stored, but an effect that
    // chased `apiKey.allowedIps` would also overwrite a draft in progress the
    // moment the list query refetched underneath it.
    if (next) setIps(apiKey.allowedIps ?? []);
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Edit IP restrictions">
          <ShieldCheck className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>IP Restrictions</DialogTitle>
          <DialogDescription>
            Limit {apiKey.label || "this key"} to addresses you choose. Remove
            every address to let it work from anywhere.
          </DialogDescription>
        </DialogHeader>

        <IpListEditor
          value={ips}
          onChange={setIps}
          myIp={myIp?.ip}
          disabled={updateIps.isPending}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={updateIps.isPending}
          >
            Cancel
          </Button>
          <Button onClick={save} disabled={updateIps.isPending}>
            {updateIps.isPending ? "Saving..." : "Save Restrictions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateKeyDialog() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [ips, setIps] = useState<string[]>([]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const createKey = useCreateApiKey();
  const { data: myIp } = useMyIp(open && !createdKey);

  const handleCreate = () => {
    createKey.mutate(
      { label, ...(ips.length > 0 ? { allowedIps: ips } : {}) },
      {
        onSuccess: (data) => {
          setCreatedKey(data.key);
          setShowKey(true);
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setLabel("");
      setIps([]);
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
      <DialogContent className="sm:max-w-lg">
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
                    : createdKey.slice(0, 12) +
                      "•".repeat(Math.max(0, createdKey.length - 12))}
                </code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={showKey ? "Hide key" : "Show key"}
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-label">Label</Label>
                <Input
                  id="api-key-label"
                  placeholder="e.g. Production Key"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>IP Restrictions (optional)</Label>
                <IpListEditor
                  value={ips}
                  onChange={setIps}
                  myIp={myIp?.ip}
                  disabled={createKey.isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createKey.isPending}>
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
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Copy key"
      onClick={handleCopy}
    >
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
          <TableHead>IP Restrictions</TableHead>
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
