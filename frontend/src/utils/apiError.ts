import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

function isFetchError(err: unknown): err is FetchBaseQueryError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (isFetchError(err)) {
    const data = err.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? fallback;
  }
  return fallback;
}
