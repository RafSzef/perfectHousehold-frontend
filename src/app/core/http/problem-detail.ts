import { HttpErrorResponse } from '@angular/common/http';

/**
 * RFC 9457 Problem Details payload returned by the backend GlobalExceptionHandler.
 */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  timestamp?: string;
  errors?: Record<string, string> | string[];
}

export interface ParsedHttpError {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
  errorList: string[];
  problem: ProblemDetail | null;
}

export interface ParseHttpErrorOptions {
  fallbackMessage?: string;
  statusMessages?: Partial<Record<number, string>>;
}

const CONNECTION_ERROR_MESSAGE = 'Nie można połączyć się z serwerem. Spróbuj ponownie za chwilę.';
const SERVER_ERROR_MESSAGE = 'Wystąpił błąd serwera. Spróbuj ponownie później.';
const DEFAULT_ERROR_MESSAGE = 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';

const KNOWN_DETAIL_MESSAGES: Readonly<Record<string, string>> = {
  'Current password does not match': 'Aktualne hasło jest nieprawidłowe.',
  'One or more fields failed validation.': 'Popraw zaznaczone pola formularza.',
  'Request parameters failed validation.': 'Nieprawidłowe parametry żądania.',
  'The request conflicts with existing data.': 'Podane dane są już zajęte.',
  'Authentication is required or credentials are invalid.':
    'Wymagane jest zalogowanie lub dane logowania są nieprawidłowe.',
  'You do not have permission to perform this action.': 'Brak uprawnień do wykonania tej operacji.',
  'Failed to read request': 'Nieprawidłowy format danych żądania.',
};

const KNOWN_FIELD_MESSAGES: Readonly<Record<string, string>> = {
  'Username must not be blank': 'Nazwa użytkownika nie może być pusta.',
  'Email must not be blank': 'Adres e-mail nie może być pusty.',
  'Email must be valid': 'Podaj poprawny adres e-mail.',
  'Password must not be blank': 'Hasło nie może być puste.',
  'Current password must not be blank': 'Aktualne hasło nie może być puste.',
  'New password must not be blank': 'Nowe hasło nie może być puste.',
  'Invalid value': 'Nieprawidłowa wartość.',
  'Invalid parameter': 'Nieprawidłowy parametr.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readOptionalNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function parseErrorsExtension(value: unknown): Record<string, string> | string[] | undefined {
  if (Array.isArray(value)) {
    const items = value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
    return items.length > 0 ? items : undefined;
  }

  if (isRecord(value)) {
    const fieldErrors: Record<string, string> = {};
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === 'string' && val.trim().length > 0) {
        fieldErrors[key] = val.trim();
      }
    }
    return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
  }

  return undefined;
}

/**
 * Safely parses an unknown HTTP error body into an RFC 9457 ProblemDetail object.
 */
export function parseProblemDetail(body: unknown): ProblemDetail | null {
  let candidate: unknown = body;

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (!trimmed.startsWith('{')) {
      return null;
    }
    try {
      candidate = JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }

  if (!isRecord(candidate)) {
    return null;
  }

  const problem: ProblemDetail = {
    type: readOptionalString(candidate, 'type'),
    title: readOptionalString(candidate, 'title'),
    status: readOptionalNumber(candidate, 'status'),
    detail: readOptionalString(candidate, 'detail'),
    instance: readOptionalString(candidate, 'instance'),
    timestamp: readOptionalString(candidate, 'timestamp'),
    errors: parseErrorsExtension(candidate['errors']),
  };

  const hasProblemField =
    problem.type !== undefined ||
    problem.title !== undefined ||
    problem.status !== undefined ||
    problem.detail !== undefined ||
    problem.errors !== undefined;

  return hasProblemField ? problem : null;
}

function formatDetailMessage(detail: string): string {
  const exactMatch = KNOWN_DETAIL_MESSAGES[detail];
  if (exactMatch) {
    return exactMatch;
  }

  const usernameTakenMatch = /^Username is already taken:\s*(.+)$/i.exec(detail);
  if (usernameTakenMatch) {
    return `Nazwa użytkownika "${usernameTakenMatch[1].trim()}" jest już zajęta.`;
  }

  const emailTakenMatch = /^Email is already taken:\s*(.+)$/i.exec(detail);
  if (emailTakenMatch) {
    return `Adres e-mail "${emailTakenMatch[1].trim()}" jest już zajęty.`;
  }

  return detail;
}

function formatFieldMessage(message: string): string {
  return KNOWN_FIELD_MESSAGES[message] ?? message;
}

/**
 * Parses an HTTP or runtime error into a safe, UI-ready structure without leaking
 * internal server or infrastructure details (such as hostnames, ports, or stack traces).
 */
export function parseHttpError(
  err: unknown,
  optionsOrFallback: string | ParseHttpErrorOptions = {},
): ParsedHttpError {
  const options: ParseHttpErrorOptions =
    typeof optionsOrFallback === 'string'
      ? { fallbackMessage: optionsOrFallback }
      : optionsOrFallback;
  const fallbackMessage = options.fallbackMessage ?? DEFAULT_ERROR_MESSAGE;

  if (!(err instanceof HttpErrorResponse)) {
    const message =
      err instanceof Error && err.message.trim().length > 0 ? err.message.trim() : fallbackMessage;
    return {
      status: 0,
      message,
      fieldErrors: {},
      errorList: [],
      problem: null,
    };
  }

  const status = err.status;

  // Never expose backend/proxy/infrastructure details for network or gateway failures
  if (status === 0 || status === 502 || status === 503 || status === 504) {
    return {
      status,
      message: options.statusMessages?.[status] ?? CONNECTION_ERROR_MESSAGE,
      fieldErrors: {},
      errorList: [],
      problem: null,
    };
  }

  // Never expose internal server details for 5xx responses
  if (status >= 500) {
    return {
      status,
      message: options.statusMessages?.[status] ?? SERVER_ERROR_MESSAGE,
      fieldErrors: {},
      errorList: [],
      problem: null,
    };
  }

  const problem = parseProblemDetail(err.error);
  const fieldErrors: Record<string, string> = {};
  if (problem?.errors && !Array.isArray(problem.errors)) {
    for (const [field, msg] of Object.entries(problem.errors)) {
      fieldErrors[field] = formatFieldMessage(msg);
    }
  }
  const errorList: string[] = Array.isArray(problem?.errors)
    ? problem.errors.map(formatFieldMessage)
    : [];

  const statusOverride = options.statusMessages?.[status];
  if (statusOverride) {
    return {
      status,
      message: statusOverride,
      fieldErrors,
      errorList,
      problem,
    };
  }

  let message: string;
  if (errorList.length > 0) {
    message = errorList.join(' ');
  } else if (problem?.detail) {
    message = formatDetailMessage(problem.detail);
  } else if (Object.keys(fieldErrors).length > 0) {
    message = 'Popraw zaznaczone pola formularza.';
  } else if (problem?.title) {
    message = problem.title;
  } else {
    message = fallbackMessage;
  }

  return {
    status,
    message,
    fieldErrors,
    errorList,
    problem,
  };
}
