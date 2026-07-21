import { useState } from "react";
import { Plus, Send, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyTemplates,
  useChannels,
  useCreateTemplate,
  useUpdateTemplate,
  useSubmitTemplate,
  useDeleteTemplate,
} from "@/hooks/useTemplates";
import { getApiErrorMessage } from "@/lib/api-error";
import type { OtpTemplate, TemplateStatus } from "@/types";

const STATUS_TONE: Record<TemplateStatus, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pending_review:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const PLACEHOLDERS = ["{{otp}}", "{{expiry}}", "{{appName}}"];
const SAMPLE: Record<string, string> = {
  otp: "483926",
  expiry: "5",
  appName: "MyApp",
};

function renderPreview(body: string): string {
  return body.replace(
    /\{\{(\w+)\}\}/g,
    (_, k: string) => SAMPLE[k] ?? `{{${k}}}`,
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: OtpTemplate | null;
}) {
  const { data: channels } = useChannels();
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  // The parent keys this component by editing id, so useState init runs fresh
  // for each create/edit target — no effect needed to re-seed.
  const [name, setName] = useState(editing?.name ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [channelId, setChannelId] = useState(editing?.channelId ?? "");

  const firstChannel = channels?.[0]?.id ?? "";
  const effectiveChannel = channelId || firstChannel;
  const hasOtp = /\{\{otp\}\}/.test(body);
  const canSubmit = name.trim() && hasOtp && effectiveChannel;
  const pending = create.isPending || update.isPending;

  function insertPlaceholder(p: string) {
    setBody((b) => `${b}${p}`);
  }

  function handleSave() {
    if (!canSubmit) return;
    const onSuccess = () => {
      toast.success(editing ? "Template updated" : "Template created");
      onOpenChange(false);
    };
    const onError = (e: unknown) => toast.error(getApiErrorMessage(e));
    if (editing) {
      update.mutate(
        { id: editing.id, payload: { name, body } },
        { onSuccess, onError },
      );
    } else {
      create.mutate(
        { name, body, channelId: effectiveChannel, language: "en" },
        { onSuccess, onError },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit template" : "New OTP template"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="tpl-name">Name</Label>
            <Input
              id="tpl-name"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {!editing && channels && channels.length > 1 && (
            <div className="space-y-1">
              <Label htmlFor="tpl-channel">Channel</Label>
              <select
                id="tpl-channel"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={effectiveChannel}
                onChange={(e) => setChannelId(e.target.value)}
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="tpl-body">Message body</Label>
            <textarea
              id="tpl-body"
              className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={body}
              maxLength={500}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your OTP is {{otp}}. Valid {{expiry}} min."
            />
            <div className="flex flex-wrap gap-1">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => insertPlaceholder(p)}
                  className="rounded border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  {p}
                </button>
              ))}
            </div>
            {body && !hasOtp && (
              <p className="text-sm text-destructive">
                Body must contain the {"{{otp}}"} placeholder.
              </p>
            )}
          </div>
          {body && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="mb-1 text-xs text-muted-foreground">Preview</p>
              {renderPreview(body)}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!canSubmit || pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TemplatesPage() {
  const { data, isLoading } = useMyTemplates(1);
  const submit = useSubmitTemplate();
  const remove = useDeleteTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OtpTemplate | null>(null);

  const templates = data?.data ?? [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">OTP Templates</h1>
          <p className="text-sm text-muted-foreground">
            Create templates, submit them for review, and use approved ones when
            sending OTPs.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          New template
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You have no templates yet. Create one to get started.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Body</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => {
              const editable = t.status === "draft" || t.status === "rejected";
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[t.status]}`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                    {t.rejectionReason && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.rejectionReason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {t.body}
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {editable && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditing(t);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Submit for review"
                          onClick={() =>
                            submit.mutate(t.id, {
                              onSuccess: () =>
                                toast.success("Submitted for review"),
                              onError: (e) =>
                                toast.error(getApiErrorMessage(e)),
                            })
                          }
                        >
                          <Send className="size-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        remove.mutate(t.id, {
                          onSuccess: () => toast.success("Template deleted"),
                          onError: (e) => toast.error(getApiErrorMessage(e)),
                        })
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <TemplateDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </div>
  );
}
