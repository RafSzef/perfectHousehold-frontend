export const DEFAULT_RETURN_URL = '/profile';

/**
 * Validates a post-login returnUrl to prevent Open Redirect vulnerabilities.
 * Accepts only in-app relative paths starting with a single '/' (excluding '//' and '/\').
 */
export function sanitizeReturnUrl(
  returnUrl: string | null | undefined,
  fallback: string = DEFAULT_RETURN_URL,
): string {
  if (!returnUrl) {
    return fallback;
  }

  const trimmed = returnUrl.trim();
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Reject ASCII control characters (CR, LF, TAB, NUL, etc.)
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, 'https://app.invalid');
    if (parsed.origin !== 'https://app.invalid') {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return trimmed;
}
