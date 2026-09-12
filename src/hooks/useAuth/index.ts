import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';
import { getMe } from '@/apis/user.api';
import { logoutApi } from '@/apis/auth.api';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants';
import type { User } from '@/types';

const AUTH_QUERY_KEY = ['auth', 'me'] as const;

function hasToken() {
  return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * The label a human reads in PostHog and Sentry instead of a UUID.
 *
 * `firstName`/`lastName` are non-optional on the User type but are free-text
 * columns that can hold empty strings, so the join is trimmed and falls back to
 * the email address — a person row labelled " " is worse than one labelled by
 * address.
 */
function displayName(user: {
  firstName: string;
  lastName: string;
  email: string;
}): string {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getMe,
    enabled: hasToken(),
    retry: false,
  });

  const login = useCallback(
    (
      accessToken: string,
      userData: User,
      options?: { isNewAccount?: boolean },
    ) => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, userData);
      if (posthog.__loaded) {
        // On a brand-new account (server-confirmed via isNewUser on
        // /auth/google), alias must run BEFORE identify: it welds the
        // pre-signup person — lead_<leadId> from usePostHogLeadCapture, or
        // plain anonymous — onto user_<id>, so the lead's pre-signup
        // history and replays stay on one person. A bare identify against
        // an identified lead is refused by PostHog ("cannot merge already
        // identified users") and would split them in two. Returning sign-ins
        // must NOT alias — the flag is the server saying the account was
        // literally just created, never inferred client-side.
        if (options?.isNewAccount) {
          posthog.alias(`user_${userData.id}`);
        }
        posthog.identify(`user_${userData.id}`, {
          email: userData.email,
          name: displayName(userData),
        });
      }
      // Sentry carries the same identity, so an error report says WHICH
      // customer hit it rather than only where it happened. Deliberately
      // outside the posthog guard: the two are independent, and off production
      // Sentry was never initialised so this is a no-op.
      Sentry.setUser({
        id: userData.id,
        email: userData.email,
        username: displayName(userData),
      });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      queryClient.clear();
      if (posthog.__loaded) {
        // Drop the device→person association so the next visitor on a
        // shared browser doesn't have their session stitched onto this
        // account's replay and event history.
        posthog.reset();
      }
      // Same reason as posthog.reset(): on a shared browser the next person
      // must not have this account's name attached to their crash reports.
      Sentry.setUser(null);
      window.location.href = ROUTES.SIGN_IN;
    }
  }, [queryClient]);

  return {
    user: user ?? null,
    isLoading: hasToken() && isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
