import { useState, useMemo } from "react";
import {
  FileText,
  Copy,
  Check,
  Play,
  Search,
  BookOpen,
  Info,
  ChevronRight,
  ShieldCheck,
  Globe,
  AlertCircle,
  Hash,
  Terminal,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUsageGuide } from "@/hooks/useApiKeys";
import { getTemplates } from "@/apis/otp.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { OtpTemplate } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function ApiDocsPage() {
  const { data: usageGuide, isLoading: usageLoading } = useUsageGuide();
  const [activeTab, setActiveTab] = useState("docs");
  const [testApiKey, setTestApiKey] = useState("");

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">API Reference</h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
          <Button 
            variant={activeTab === "docs" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setActiveTab("docs")}
          >
            Documentation
          </Button>
          <Button 
            variant={activeTab === "test" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setActiveTab("test")}
          >
            Interactive Playground
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Content Column */}
        <div className="lg:col-span-8 space-y-10">
          {activeTab === "docs" ? (
            <>
              <section id="getting-started" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="size-5 text-primary" />
                  <h2 className="text-xl font-bold">Getting Started</h2>
                </div>
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      StartMessaging provides a powerful, asynchronous API for sending OTPs and managing message communication.
                      All requests are made over HTTPS to our base URL.
                    </p>
                    <div className="flex items-center gap-3 rounded-md bg-muted p-3 font-mono text-sm group">
                      <span className="text-primary font-bold">Base URL:</span>
                      <code className="text-foreground">{API_BASE_URL}</code>
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          navigator.clipboard.writeText(API_BASE_URL);
                          toast.success("URL copied");
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="authentication" className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600" />
                  <h2 className="text-xl font-bold">Authentication</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our API uses API Keys for authentication. You must include your key in the <code className="font-bold text-foreground">X-API-Key</code> header of every request.
                </p>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Hash className="size-4 text-primary" />
                      Authorization Header
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-black p-4 text-emerald-400 font-mono text-xs">
                      X-API-Key: sm_live_********************************
                    </div>
                    <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Protect your API keys!</p>
                        <p className="text-xs opacity-90">Never share your keys or commit them to version control. If a key is compromised, revoke it immediately from the dashboard.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="endpoints" className="space-y-8">
                <div className="flex items-center gap-2">
                  <Terminal className="size-5 text-primary" />
                  <h2 className="text-xl font-bold">Endpoints</h2>
                </div>

                {usageLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  usageGuide?.examples && Object.entries(usageGuide.examples).map(([key, example]: [string, any]) => (
                    <EndpointCard 
                      key={key} 
                      example={example} 
                      testApiKey={testApiKey}
                    />
                  ))
                )}

                <EndpointCard 
                  example={{
                    title: "Check Status",
                    description: "Fetch the real-time delivery status of an OTP request. Statuses include initiated, queued, sent, delivered, and failed.",
                    endpoint: "GET /messages/:id",
                    languages: {
                      curl: `curl -X GET ${API_BASE_URL}/messages/MESSAGE_ID \\\n  -H "X-API-Key: ${testApiKey || 'YOUR_API_KEY'}"`,
                      javascript: `const res = await fetch(\`${API_BASE_URL}/messages/MESSAGE_ID\`, {\n  headers: { 'X-API-Key': '${testApiKey || 'YOUR_API_KEY'}' }\n});`,
                      python: `import requests\nres = requests.get("${API_BASE_URL}/messages/MESSAGE_ID", headers={"X-API-Key": "${testApiKey || 'YOUR_API_KEY'}"})`,
                    }
                  }}
                  testApiKey={testApiKey}
                />
              </section>

              <TemplatesReference />
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <Play className="size-5 text-emerald-600" />
                <h2 className="text-2xl font-bold">Interactive Sandbox</h2>
              </div>
              <ApiTester 
                onApiKeyChange={setTestApiKey} 
                initialApiKey={testApiKey} 
              />
            </div>
          )}
        </div>

        {/* Right Sidebar - Quick Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  {[
                    { id: "getting-started", label: "Getting Started" },
                    { id: "authentication", label: "Authentication" },
                    { id: "endpoints", label: "Endpoints" },
                    { id: "templates", label: "Templates Reference" },
                  ].map((link) => (
                    <button
                      key={link.id}
                      onClick={() => {
                        setActiveTab("docs");
                        document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted transition-colors border-t first:border-t-0"
                    >
                      {link.label}
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Play className="size-4 text-primary" />
                  Live Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You can test all endpoints directly from this page using the Sandbox. Paste your API key to get started.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-background"
                  onClick={() => setActiveTab("test")}
                >
                  Open Sandbox
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Error Responses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-red-600">401</span>
                  <span className="text-muted-foreground">Unauthorized / Invalid Key</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-red-600">402</span>
                  <span className="text-muted-foreground">Insufficient Balance</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-red-600">429</span>
                  <span className="text-muted-foreground">Rate Limit Exceeded</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function EndpointCard({ example, testApiKey }: { example: any, testApiKey: string }) {
  const codeSnippets = useMemo(() => {
    if (!testApiKey) return example.languages;
    
    // Inject real API key into snippets
    const enriched: any = {};
    Object.entries(example.languages).forEach(([lang, code]: [string, any]) => {
      enriched[lang] = code.replace(/sm_live_your_api_key_here|YOUR_API_KEY/g, testApiKey);
    });
    return enriched;
  }, [example.languages, testApiKey]);

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted/50 border-b p-4">
        <div className="flex items-center justify-between gap-4 mb-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase bg-background">
            {example.endpoint.split(' ')[0]}
          </Badge>
          <code className="text-xs font-mono text-primary font-bold">{example.endpoint.split(' ')[1]}</code>
        </div>
        <h3 className="font-bold text-lg">{example.title}</h3>
      </div>
      <CardContent className="pt-6 space-y-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {example.description}
        </p>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request Examples</h4>
          <Tabs defaultValue="curl">
            <TabsList className="bg-muted/50 p-1">
              {Object.keys(codeSnippets).map((lang) => (
                <TabsTrigger key={lang} value={lang} className="text-[10px]">
                  {lang.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(codeSnippets).map(([lang, code]: [string, any]) => (
              <TabsContent key={lang} value={lang} className="mt-4">
                <div className="relative group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={code} />
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-black p-4 text-emerald-400 font-mono text-xs leading-relaxed border border-white/10">
                    <code>{code}</code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplatesReference() {
  const { data: templates = [], isLoading } = useQuery<OtpTemplate[]>({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  return (
    <section id="templates" className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="size-5 text-primary" />
        <h2 className="text-xl font-bold">Templates Reference</h2>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50">
            <Info className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold mb-1">Variable Substitution</p>
              <p className="opacity-90">Placeholders like <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">{"{{otp}}"}</code> are automatically filled from your request. Ensure you pass the correct templateId.</p>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[150px]">Template ID</TableHead>
                    <TableHead>Message Body</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 group">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono max-w-[100px] truncate" title={t.id}>
                            {t.id}
                          </code>
                          <CopyButton text={t.id} />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground leading-relaxed">
                        <TemplateBody body={t.body} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-[9px] uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200">
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="opacity-50 grayscale bg-muted/20">
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">auth_verify_v2</code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">
                      Coming Soon: Multi-variable template support...
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-[9px] uppercase">
                        Queued
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow className="opacity-50 grayscale bg-muted/20">
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">transaction_alert_v1</code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">
                      Coming Soon: Transactional alert support...
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-[9px] uppercase">
                        Queued
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
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
            className="rounded bg-primary/10 px-1 py-0.5 font-mono text-primary font-bold text-[11px]"
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

function ApiTester({ onApiKeyChange, initialApiKey }: { onApiKeyChange: (key: string) => void, initialApiKey: string }) {
  const { data: templates = [] } = useQuery<OtpTemplate[]>({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  const [fullApiKey, setLocalApiKey] = useState(initialApiKey);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [requestId, setRequestId] = useState("");
  
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleApiKeyChange = (val: string) => {
    setLocalApiKey(val);
    onApiKeyChange(val);
  };

  const handleSend = async () => {
    if (!fullApiKey || !phoneNumber || !templateId) {
      toast.error("Required: API Key, Phone, and Template ID");
      return;
    }

    setIsSending(true);
    setResponse(null);
    try {
      const res = await fetch(`${API_BASE_URL}/otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": fullApiKey,
        },
        body: JSON.stringify({
          phoneNumber,
          variables: { otp: otp || "123456" },
          templateId
        }),
      });
      const json = await res.json();
      setResponse(json);
      if (res.ok) {
        toast.success("OTP request initiated!");
        if (json.data?.messageId) setRequestId(json.data.messageId);
      } else {
        toast.error(json.message || "Request failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Request failed");
    } finally {
      setIsSending(false);
    }
  };

  const handleCheck = async () => {
    if (!requestId || !fullApiKey) {
      toast.error("Message ID and API Key required");
      return;
    }

    setIsChecking(true);
    setResponse(null);
    try {
      const res = await fetch(`${API_BASE_URL}/messages/${requestId}`, {
        headers: {
          "X-API-Key": fullApiKey,
        },
      });
      const json = await res.json();
      setResponse(json);
      if (res.ok) {
        toast.success("Status retrieved");
      } else {
        toast.error(json.message || "Failed to fetch status");
      }
    } catch (err: any) {
      toast.error(err.message || "Request failed");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Config & Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="size-3" />
                Your Live API Key
              </label>
              <Input 
                type="password"
                placeholder="sm_live_..."
                value={fullApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)} 
                className="font-mono text-xs h-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-100 dark:border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Fire OTP API
              <Badge variant="outline" className="text-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10">POST</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Phone Number</label>
              <Input 
                placeholder="+91..." 
                value={phoneNumber} 
                className="h-9"
                onChange={e => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Template</label>
              <select 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={templateId} 
                onChange={e => setTemplateId(e.target.value)}
              >
                <option value="">Choose a Template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center justify-between">
                <span>OTP Code (Mock)</span>
                <span className="text-[10px] text-muted-foreground font-normal italic">4-6 digits</span>
              </label>
              <Input 
                placeholder="123456" 
                value={otp} 
                className="h-9"
                onChange={e => setOtp(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" 
              onClick={handleSend} 
              disabled={isSending}
            >
              {isSending ? "Executing..." : "Call API Now"}
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-100 dark:border-blue-900/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Check Message Status
              <Badge variant="outline" className="text-[8px] bg-blue-50 text-blue-700 dark:bg-blue-900/10">GET</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Message ID</label>
              <Input 
                placeholder="uuid..." 
                value={requestId} 
                className="h-9"
                onChange={e => setRequestId(e.target.value)}
              />
            </div>
            <Button 
              variant="secondary"
              className="w-full h-9" 
              onClick={handleCheck} 
              disabled={isChecking}
            >
              {isChecking ? "Retrieving..." : "Verify Delivery"}
              <Search className="ml-1 size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Response Output
        </h4>
        <Card className="bg-black/95 text-emerald-400 border-emerald-900/50 min-h-[500px] flex flex-col">
          <CardContent className="p-4 flex-1 font-mono text-xs overflow-auto">
            {response ? (
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30 select-none pt-20">
                <Terminal className="size-16" />
                <p>Waiting for API request...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
      className="size-7 hover:bg-muted/80 transition-all rounded-md" 
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  );
}
