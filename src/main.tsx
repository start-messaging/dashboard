// Sentry must initialize before anything else runs, so errors thrown during
// module evaluation of the rest of the app are already reportable.
import './instrument';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react';
import { queryClient } from '@/lib/query-client';
import { deploymentEnvironment } from '@/lib/deployment-environment';
import { ErrorBoundary } from '@/components/common/error-boundary';
import App from './App';
import './index.css';

// Without a key nothing initializes — no network calls, no recording, and
// every posthog.* call elsewhere is guarded on __loaded, so an environment
// without the key behaves exactly as it did before analytics existed.
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2025-05-24', // history_change pageviews — SPA routes tracked automatically
    person_profiles: 'identified_only',
    custom_campaign_params: ['smref'], // smref lands as event/person properties like a UTM
    session_recording: { maskAllInputs: true },
    // Stamped here rather than registered as a super property: `before_send`
    // runs for every event, the session's first $pageview included, so there is
    // no window in which an event is filed with no environment on it.
    before_send: (event) => {
      if (event) {
        event.properties.environment = deploymentEnvironment(
          window.location.hostname,
        );
      }
      return event;
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
            <Toaster richColors position="top-right" />
          </BrowserRouter>
        </ErrorBoundary>
      </QueryClientProvider>
    </PostHogProvider>
  </StrictMode>,
);
