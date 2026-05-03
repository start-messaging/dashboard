import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Upload,
  X,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  sendMobileOtp,
  verifyMobileOtp,
  submitKyc,
} from '@/apis/onboarding.api';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PhoneInput } from '@/components/phone-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  countryByCode,
  countries,
  DEFAULT_COUNTRY_CODE,
  isValidPhoneLength,
} from '@/data/countries';

const STEPS = [
  { step: 1, title: 'Verify Mobile' },
  { step: 2, title: 'Business Details' },
  { step: 3, title: 'Approval' },
] as const;

const SUPPORT_WHATSAPP_URL =
  'https://wa.me/916376383348?text=Hi%2C%20I%20need%20help%20with%20StartMessaging%20onboarding.';

function StepIndicator({
  currentStep,
  completedSteps,
}: {
  currentStep: number;
  completedSteps: Set<number>;
}) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map(({ step, title }, idx) => {
        const isCompleted = completedSteps.has(step);
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  isCompleted
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={`text-xs ${isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
              >
                {title}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-2 mb-5 h-0.5 flex-1 min-w-8 ${
                  completedSteps.has(step) ? 'bg-emerald-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

function OnboardingSupportCta() {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-center">
      <p className="text-xs text-muted-foreground">
        Need help at any step? Reach support on WhatsApp.
      </p>
      <a
        href={SUPPORT_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#20BD5A]"
      >
        <MessageCircle className="h-5 w-5" />
        Chat with Support on WhatsApp
      </a>
    </div>
  );
}

function OtpDigitInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').slice(0, 6).split('');

  const focusInput = (index: number) => {
    if (index >= 0 && index < 6) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char;
    const newOtp = newDigits.join('').replace(/\s/g, '');
    onChange(newOtp);
    if (char && index < 5) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (pasted) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, 5));
    }
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-10 w-10 rounded-lg border border-input bg-transparent text-center text-lg font-medium transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </div>
  );
}

function MobileVerificationStep() {
  const queryClient = useQueryClient();
  const defaultDialCode =
    countryByCode.get(DEFAULT_COUNTRY_CODE)?.dialCode || '+91';
  const [phoneE164, setPhoneE164] = useState(defaultDialCode);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const selectedCountry = (() => {
    const sorted = [...countries].sort(
      (a, b) => b.dialCode.length - a.dialCode.length,
    );
    for (const c of sorted) {
      if (phoneE164.startsWith(c.dialCode)) return c;
    }
    return countryByCode.get(DEFAULT_COUNTRY_CODE)!;
  })();

  const isPhoneValid =
    phoneE164.length > selectedCountry.dialCode.length &&
    isValidPhoneLength(phoneE164, selectedCountry);

  const startResendTimer = useCallback(() => {
    setResendTimer(30);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await sendMobileOtp(phoneE164);
      if (result.sent) {
        setOtpSent(true);
        startResendTimer();
        toast.success('OTP sent successfully');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await sendMobileOtp(phoneE164);
      if (result.sent) {
        startResendTimer();
        setOtp('');
        toast.success('OTP resent successfully');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setVerifying(true);
    try {
      await verifyMobileOtp(otp);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {!otpSent ? (
        <div className="space-y-3">
          <Label htmlFor="phone">Mobile Number</Label>
          <PhoneInput
            value={phoneE164}
            onChange={setPhoneE164}
            disabled={loading}
          />
          <Button
            className="w-full"
            onClick={handleSendOtp}
            disabled={loading || !isPhoneValid}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Verification Code</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground underline hover:text-foreground"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setError('');
                setResendTimer(0);
              }}
            >
              Change number
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Code sent to{' '}
            <span className="font-medium text-foreground">{phoneE164}</span>
          </p>
          <OtpDigitInput
            value={otp}
            onChange={setOtp}
            disabled={verifying}
          />
          <div className="flex items-center gap-3">
            <Button
              className="flex-1"
              onClick={handleVerifyOtp}
              disabled={verifying || otp.length !== 6}
            >
              {verifying && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {verifying ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
          <div className="text-center">
            {resendTimer > 0 ? (
              <span className="text-xs text-muted-foreground">
                Resend OTP in {resendTimer}s
              </span>
            ) : (
              <button
                type="button"
                className="text-xs text-primary underline hover:text-primary/80"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}

      <ErrorDisplay message={error} />
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BusinessDetailsStep() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    pan: '',
    gstin: '',
    businessAddress: '',
    websiteUrl: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('businessName', form.businessName);
      formData.append('pan', form.pan);
      if (form.gstin) formData.append('gstin', form.gstin);
      formData.append('businessAddress', form.businessAddress);
      if (form.websiteUrl.trim()) {
        formData.append('websiteUrl', form.websiteUrl.trim());
      }
      if (file) formData.append('document', file);

      await submitKyc(formData);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('KYC submitted successfully');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const isNameValid = form.businessName.trim().length >= 3;
  const isPanValid = PAN_REGEX.test(form.pan);
  const isGstinValid = !form.gstin || GSTIN_REGEX.test(form.gstin);
  const isAddressValid = form.businessAddress.trim().length >= 10;
  const isWebsiteValid =
    !form.websiteUrl ||
    (() => {
      try {
        // Keep in sync with backend optional IsUrl validation.
        new URL(form.websiteUrl.trim());
        return true;
      } catch {
        return false;
      }
    })();


  const isValid =
    isNameValid &&
    isPanValid &&
    isGstinValid &&
    isAddressValid &&
    isWebsiteValid &&
    file;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Business Information
        </p>
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            placeholder="Acme Corp"
            value={form.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
            className={form.businessName && !isNameValid ? 'border-red-500' : ''}
          />
          {form.businessName && !isNameValid && (
            <p className="text-[10px] text-red-500 font-medium">Business Name must be at least 3 characters</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pan">PAN *</Label>
            <Input
              id="pan"
              placeholder="ABCDE1234F"
              value={form.pan}
              onChange={(e) =>
                handleChange('pan', e.target.value.toUpperCase())
              }
              maxLength={10}
              className={form.pan && !isPanValid ? 'border-red-500' : ''}
            />
            {form.pan && !isPanValid ? (
              <p className="text-[10px] text-red-500 font-medium">Invalid PAN format (e.g., ABCDE1234F)</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                10-character alphanumeric (e.g., ABCDE1234F)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (optional)</Label>
            <Input
              id="gstin"
              placeholder="22ABCDE1234F1Z5"
              value={form.gstin}
              onChange={(e) =>
                handleChange('gstin', e.target.value.toUpperCase())
              }
              maxLength={15}
              className={form.gstin && !isGstinValid ? 'border-red-500' : ''}
            />
            {form.gstin && !isGstinValid && (
              <p className="text-[10px] text-red-500 font-medium">Invalid GSTIN format (15 characters)</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business Address *</Label>
          <Input
            id="businessAddress"
            placeholder="123 Business St, Mumbai, MH 400001"
            value={form.businessAddress}
            onChange={(e) => handleChange('businessAddress', e.target.value)}
            className={form.businessAddress && !isAddressValid ? 'border-red-500' : ''}
          />
          {form.businessAddress && !isAddressValid && (
            <p className="text-[10px] text-red-500 font-medium">Address must be at least 10 characters</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL (optional)</Label>
          <Input
            id="websiteUrl"
            placeholder="https://example.com"
            value={form.websiteUrl}
            onChange={(e) => handleChange('websiteUrl', e.target.value)}
            className={form.websiteUrl && !isWebsiteValid ? 'border-red-500' : ''}
          />
          {form.websiteUrl && !isWebsiteValid && (
            <p className="text-[10px] text-red-500 font-medium">Invalid URL format (e.g., https://example.com)</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Documents
        </p>
        <div className="space-y-2">
          <Label htmlFor="document">KYC Document *</Label>
          {file ? (
            <div className="flex items-center gap-2 rounded-lg border border-input px-3 py-2">
              <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="rounded-md p-1 hover:bg-accent"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <Input
              ref={fileInputRef}
              id="document"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          )}
          <p className="text-xs text-muted-foreground">
            PDF, JPG, or PNG. Max 5MB.
          </p>
        </div>
      </div>

      <ErrorDisplay message={error} />


      <Button
        className={`w-full ${!isValid ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
        onClick={handleSubmit}
        disabled={loading || !isValid}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Submitting...' : 'Submit for Review'}
      </Button>
    </div>
  );
}

function PendingApprovalStep() {
  const { user } = useAuth();

  const isRejected = user?.kycStatus === 'rejected';

  return (
    <div className="space-y-4 text-center">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          isRejected ? 'bg-destructive/10' : 'bg-muted'
        }`}
      >
        <Clock
          className={`h-7 w-7 ${
            isRejected
              ? 'text-destructive'
              : 'animate-pulse text-muted-foreground'
          }`}
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-medium">
          {isRejected ? 'Application Needs Changes' : 'Application Under Review'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isRejected
            ? 'Your application was returned for changes. Please resubmit with the required corrections.'
            : "We're reviewing your business details. This usually takes 1-2 business days."}
        </p>
      </div>

      <Separator />

      <div className="space-y-2 text-left">
        {user?.businessName && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Business</span>
            <span className="text-sm font-medium">{user.businessName}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">KYC Status</span>
          <Badge variant={isRejected ? 'destructive' : 'secondary'}>
            {isRejected ? 'Rejected' : 'Pending'}
          </Badge>
        </div>
      </div>

      <Separator />

      {isRejected && (
        <p className="text-xs text-muted-foreground">
          Please update your details and resubmit for review.
        </p>
      )}
    </div>
  );
}
export function OnboardingPage() {
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  let currentStep: number;
  if (!user?.mobileVerified) {
    currentStep = 1;
  } else if (
    user.kycStatus === 'not_submitted' ||
    user.kycStatus === 'rejected'
  ) {
    currentStep = 2;
  } else {
    currentStep = 3;
  }

  const completedSteps = new Set<number>();
  if (user?.mobileVerified) completedSteps.add(1);
  if (user?.kycStatus === 'pending' || user?.kycStatus === 'approved') {
    completedSteps.add(2);
  }
  if (user?.kycStatus === 'approved') completedSteps.add(3);

  const stepDescriptions: Record<number, string> = {
    1: "We'll send a one-time code to verify your number",
    2: "Required for KYC compliance. We'll review within 1-2 business days.",
    3: 'Your application is being reviewed',
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Complete Your Setup</CardTitle>
          <CardDescription>{stepDescriptions[currentStep]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
          />

          <Separator />

          <div className="animate-in fade-in duration-300">
            {currentStep === 1 && <MobileVerificationStep />}
            {currentStep === 2 && <BusinessDetailsStep />}
            {currentStep === 3 && <PendingApprovalStep />}
          </div>

          <OnboardingSupportCta />

          <Separator />

          <div className="flex justify-center">
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Sign out and finish later
            </button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? Your progress will be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setShowLogoutDialog(false);
                await logout();
              }}
            >
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
