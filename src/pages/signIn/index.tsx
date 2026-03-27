import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { googleLogin } from '@/apis/auth.api';
import { getApiErrorMessage } from '@/lib/api-error';
import { ROUTES } from '@/lib/constants';
import { Chrome, Loader2 } from 'lucide-react';

export function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(true);

  const handleCredentialResponse = useCallback(
    async (response: google.accounts.id.CredentialResponse) => {
      try {
        const result = await googleLogin({ idToken: response.credential });
        login(result.accessToken, result.user);
        navigate(
          result.user.hasCompletedOnboarding
            ? ROUTES.DASHBOARD
            : ROUTES.ONBOARDING,
          { replace: true },
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [login, navigate],
  );

  const initializeGoogle = useCallback(() => {
    if (!buttonRef.current || typeof google === 'undefined') return;

    try {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with',
        shape: 'rectangular',
        width: window.innerWidth < 400 ? String(window.innerWidth - 64) : '380',
      });
      
      setIsGoogleLoading(false);
    } catch (err) {
      console.error('Google initialization failed', err);
    }
  }, [handleCredentialResponse]);

  useEffect(() => {
    // Polling for google object readiness with a timeout
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof google !== 'undefined') {
        initializeGoogle();
        clearInterval(interval);
      } else if (attempts > 50) { // 5 seconds timeout
        clearInterval(interval);
        toast.error('Failed to load Google Sign-in. Please refresh the page.');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [initializeGoogle]);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Select your account to access the developer dashboard
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative min-h-[50px] flex justify-center">
          {isGoogleLoading && (
            <div className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted bg-muted/20 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Connecting to Google Identity...</span>
            </div>
          )}
          <div 
            ref={buttonRef} 
            className={`w-full max-w-full flex justify-center transition-all duration-500 transform ${isGoogleLoading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`} 
          />
        </div>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-4 text-zinc-400 font-medium">
              Secure Provider
            </span>
          </div>
        </div>
      </div>



      <div className="group rounded-xl border bg-zinc-50/50 p-5 transition-all hover:bg-zinc-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-900">
        <div className="flex items-start gap-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Chrome className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">One-Tap Login</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              We use OAuth 2.0 to protect your account. Your password stays with Google, 
              keeping your integration keys safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

