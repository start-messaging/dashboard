import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { googleLogin } from '@/apis/auth.api';
import { getApiErrorMessage } from '@/lib/api-error';
import { ROUTES } from '@/lib/constants';

export function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!buttonRef.current || typeof google === 'undefined') return;

    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'signin_with',
      shape: 'rectangular',
      width: '100%',
    });
  }, [handleCredentialResponse]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your StartMessaging account
        </p>
      </div>
      <div ref={buttonRef} className="w-full [&>div]:w-full!" />
    </div>
  );
}
