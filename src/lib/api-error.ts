import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api-error';
import { SUPPORT } from '@/lib/constants';

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    (data as ApiErrorResponse).success === false &&
    'error' in data &&
    typeof (data as ApiErrorResponse).error?.message === 'string'
  );
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'Network error. Please check your connection.';
    }

    if (isApiErrorResponse(error.response.data)) {
      const apiError = error.response.data.error;
      const normalizedMessage = apiError.message?.toLowerCase?.() ?? '';

      if (normalizedMessage.includes('account is suspended')) {
        return `Your account is suspended. Please contact support on WhatsApp (+91 ${SUPPORT.whatsappNumber}).`;
      }

      // Fallback to first validation detail when backend sends generic message.
      if (
        apiError.message === 'Validation failed' &&
        apiError.details &&
        apiError.details.length > 0
      ) {
        return apiError.details[0].message;
      }

      return apiError.message;
    }

    if (error.response.statusText) {
      return error.response.statusText;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
