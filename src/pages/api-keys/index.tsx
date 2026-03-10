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
  FileText,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "@/hooks/useApiKeys";
import { getTemplates } from "@/apis/otp.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OtpTemplate } from "@/types";

const API_BASE_URL = "https://api.startmessaging.com";

const CODE_SNIPPETS = {
  curl: `curl -X POST ${API_BASE_URL}/otp/send \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sm_live_your_api_key_here" \\
  -d '{
    "phoneNumber": "+919876543210",
    "variables": {
      "otp": "123456",
      "appName": "YourApp",
      "expiry": "5"
    },
    "templateId": "your-template-id"
  }'`,

  javascript: `const response = await fetch("${API_BASE_URL}/otp/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "sm_live_your_api_key_here",
  },
  body: JSON.stringify({
    phoneNumber: "+919876543210",
    variables: {
      otp: "123456",
      appName: "YourApp",
      expiry: "5",
    },
    templateId: "your-template-id",
  }),
});

const data = await response.json();
console.log(data);`,

  python: `import requests

response = requests.post(
    "${API_BASE_URL}/otp/send",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "sm_live_your_api_key_here",
    },
    json={
        "phoneNumber": "+919876543210",
        "variables": {
            "otp": "123456",
            "appName": "YourApp",
            "expiry": "5",
        },
        "templateId": "your-template-id",
    },
)

print(response.json())`,

  php: `<?php
$ch = curl_init("${API_BASE_URL}/otp/send");

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "X-API-Key: sm_live_your_api_key_here",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "phoneNumber" => "+919876543210",
        "variables" => [
            "otp" => "123456",
            "appName" => "YourApp",
            "expiry" => "5",
        ],
        "templateId" => "your-template-id",
    ]),
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,

  go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"io"
)

func main() {
	body, _ := json.Marshal(map[string]interface{}{
		"phoneNumber": "+919876543210",
		"variables": map[string]string{
			"otp":     "123456",
			"appName": "YourApp",
			"expiry":  "5",
		},
		"templateId": "your-template-id",
	})

	req, _ := http.NewRequest("POST", "${API_BASE_URL}/otp/send", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", "sm_live_your_api_key_here")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	fmt.Println(string(data))
}`,
};

const LANGUAGE_LABELS: Record<string, string> = {
  curl: "cURL",
  javascript: "JavaScript",
  python: "Python",
  php: "PHP",
  go: "Go",
};

export function ApiKeysPage() {
  const { data: keys, isLoading: keysLoading } = useApiKeys();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Key className="size-5" />
        <h1 className="text-2xl font-bold">API Keys</h1>
      </div>

      <ApiKeysSection keys={keys ?? []} isLoading={keysLoading} />

      <TemplatesReference />

      <ApiUsageGuide />
    </div>
  );
}

function ApiUsageGuide() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Code className="size-5" />
        <h2 className="text-xl font-bold">API Usage Guide</h2>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Send OTP via API
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Use your API key to send OTPs programmatically. Replace the
            placeholder values with your actual API key, phone number, and
            template ID.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl">
            <TabsList>
              {Object.keys(CODE_SNIPPETS).map((lang) => (
                <TabsTrigger key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(CODE_SNIPPETS).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <div className="relative">
                  <div className="absolute top-2 right-2">
                    <CopyButton text={code} />
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-4 pr-12 text-sm">
                    <code>{code}</code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeysSection({
  keys,
  isLoading,
}: {
  keys: {
    id: string;
    keyPrefix: string;
    label: string;
    lastUsedAt: string | null;
    createdAt: string;
  }[];
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
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
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
  apiKey: {
    id: string;
    keyPrefix: string;
    label: string;
    lastUsedAt: string | null;
    createdAt: string;
  };
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
          onClick={() => deleteKey.mutate(apiKey.id)}
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
                    : createdKey.slice(0, 12) + "\u2022".repeat(28)}
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

function TemplatesReference() {
  const { data: templates = [], isLoading } = useQuery<OtpTemplate[]>({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FileText className="size-4" />
          <CardTitle className="text-sm font-medium">
            Available OTP Templates
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Pass any template ID as{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            templateId
          </code>{" "}
          in your{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            POST /otp/send
          </code>{" "}
          request. Available placeholders:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {"{{otp}}"}
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {"{{expiry}}"}
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {"{{appName}}"}
          </code>
        </p>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : templates.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No templates available.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Template ID</TableHead>
                <TableHead>Message Body</TableHead>
                <TableHead>Language</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-xs">
                    {t.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono break-all">
                        {t.id}
                      </code>
                      <CopyButton text={t.id} />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs">
                    <TemplateBody body={t.body} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {t.language}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TemplateBody({ body }: { body: string }) {
  const parts = body.split(/({{[^}]+}})/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("{{") ? (
          <code
            key={i}
            className="rounded bg-primary/10 px-1 py-0.5 font-mono text-primary"
          >
            {part}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
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
