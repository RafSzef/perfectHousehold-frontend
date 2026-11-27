import { HttpErrorResponse } from '@angular/common/http';
import { parseHttpError, parseProblemDetail } from './problem-detail';

describe('problem-detail', () => {
  describe('parseProblemDetail', () => {
    it('parses RFC 9457 ProblemDetail with field errors map', () => {
      const payload = {
        type: 'https://perfecthousehold.local/errors/validation-error',
        title: 'Validation Failed',
        status: 400,
        detail: 'One or more fields failed validation.',
        instance: '/api/auth/register',
        timestamp: '2026-01-01T12:00:00Z',
        errors: {
          username: 'Username must not be blank',
          email: 'Email must be valid',
          passwordHash: 'Password must not be blank',
        },
      };

      const parsed = parseProblemDetail(payload);
      expect(parsed).toEqual(payload);
    });

    it('parses RFC 9457 ProblemDetail with errors array', () => {
      const payload = {
        type: 'https://perfecthousehold.local/errors/parameter-validation-error',
        title: 'Parameter Validation Failed',
        status: 400,
        detail: 'Request parameters failed validation.',
        errors: ['Parameter must not be blank', 'Invalid ID'],
      };

      const parsed = parseProblemDetail(payload);
      expect(parsed?.errors).toEqual(['Parameter must not be blank', 'Invalid ID']);
    });

    it('parses JSON-encoded string ProblemDetail body', () => {
      const json = JSON.stringify({
        status: 409,
        title: 'Conflict',
        detail: 'Username is already taken: jan',
      });

      const parsed = parseProblemDetail(json);
      expect(parsed?.status).toBe(409);
      expect(parsed?.detail).toBe('Username is already taken: jan');
    });

    it('returns null for non-object or non-ProblemDetail payloads', () => {
      expect(parseProblemDetail(null)).toBeNull();
      expect(parseProblemDetail('<html>502 Bad Gateway</html>')).toBeNull();
      expect(parseProblemDetail({ foo: 'bar' })).toBeNull();
    });
  });

  describe('parseHttpError', () => {
    it('extracts and translates known fieldErrors for @Valid 400 responses', () => {
      const err = new HttpErrorResponse({
        status: 400,
        error: {
          status: 400,
          title: 'Validation Failed',
          detail: 'One or more fields failed validation.',
          type: 'https://perfecthousehold.local/errors/validation-error',
          instance: '/api/auth/change-password',
          timestamp: '2026-01-01T12:00:00Z',
          errors: {
            currentPassword: 'Current password must not be blank',
            newPassword: 'New password must not be blank',
            customField: 'Custom backend rule',
          },
        },
      });

      const parsed = parseHttpError(err);
      expect(parsed.status).toBe(400);
      expect(parsed.message).toBe('Popraw zaznaczone pola formularza.');
      expect(parsed.fieldErrors).toEqual({
        currentPassword: 'Aktualne hasło nie może być puste.',
        newPassword: 'Nowe hasło nie może być puste.',
        customField: 'Custom backend rule',
      });
      expect(parsed.errorList).toEqual([]);
    });

    it('extracts errorList for HandlerMethodValidationException 400 responses', () => {
      const err = new HttpErrorResponse({
        status: 400,
        error: {
          status: 400,
          title: 'Parameter Validation Failed',
          detail: 'Request parameters failed validation.',
          errors: ['Limit must be positive', 'Offset must be >= 0'],
        },
      });

      const parsed = parseHttpError(err);
      expect(parsed.errorList).toEqual(['Limit must be positive', 'Offset must be >= 0']);
      expect(parsed.message).toBe('Limit must be positive Offset must be >= 0');
      expect(parsed.fieldErrors).toEqual({});
    });

    it('maps 400 Current password does not match detail cleanly', () => {
      const err = new HttpErrorResponse({
        status: 400,
        error: {
          status: 400,
          title: 'Bad Request',
          detail: 'Current password does not match',
          type: 'https://perfecthousehold.local/errors/bad-request',
        },
      });

      const parsed = parseHttpError(err);
      expect(parsed.message).toBe('Aktualne hasło jest nieprawidłowe.');
      expect(parsed.problem?.detail).toBe('Current password does not match');
    });

    it('translates 409 Conflict username and email detail messages to Polish', () => {
      const usernameConflict = new HttpErrorResponse({
        status: 409,
        error: {
          status: 409,
          title: 'Conflict',
          detail: 'Username is already taken: jan',
          type: 'https://perfecthousehold.local/errors/conflict',
        },
      });

      const emailConflict = new HttpErrorResponse({
        status: 409,
        error: {
          status: 409,
          title: 'Conflict',
          detail: 'Email is already taken: jan@dom.pl',
          type: 'https://perfecthousehold.local/errors/conflict',
        },
      });

      expect(parseHttpError(usernameConflict).message).toBe(
        'Nazwa użytkownika "jan" jest już zajęta.',
      );
      expect(parseHttpError(emailConflict).message).toBe(
        'Adres e-mail "jan@dom.pl" jest już zajęty.',
      );
    });

    it('translates default 401 and 403 backend detail messages', () => {
      const unauthorized = new HttpErrorResponse({
        status: 401,
        error: {
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication is required or credentials are invalid.',
        },
      });
      const forbidden = new HttpErrorResponse({
        status: 403,
        error: {
          status: 403,
          title: 'Forbidden',
          detail: 'You do not have permission to perform this action.',
        },
      });

      expect(parseHttpError(unauthorized).message).toBe(
        'Wymagane jest zalogowanie lub dane logowania są nieprawidłowe.',
      );
      expect(parseHttpError(forbidden).message).toBe('Brak uprawnień do wykonania tej operacji.');
    });

    it.each([0, 502, 503, 504])(
      'returns generic connection error for status %i without leaking infrastructure details',
      (status) => {
        const err = new HttpErrorResponse({
          status,
          url: 'http://localhost:8081/api/auth/login',
          error: 'connect ECONNREFUSED localhost:8081',
        });

        const parsed = parseHttpError(err);
        expect(parsed.status).toBe(status);
        expect(parsed.message).not.toContain('localhost');
        expect(parsed.message).not.toContain('8081');
        expect(parsed.message).not.toContain('ECONNREFUSED');
        expect(parsed.message).toBe(
          'Nie można połączyć się z serwerem. Spróbuj ponownie za chwilę.',
        );
      },
    );

    it('returns generic server error for 500 without leaking backend details', () => {
      const err = new HttpErrorResponse({
        status: 500,
        url: 'http://localhost:8081/api/users',
        error: {
          status: 500,
          title: 'Internal Server Error',
          detail: 'JDBC connection refused on db-internal:5432',
        },
      });

      const parsed = parseHttpError(err);
      expect(parsed.status).toBe(500);
      expect(parsed.message).toBe('Wystąpił błąd serwera. Spróbuj ponownie później.');
      expect(parsed.message).not.toContain('JDBC');
      expect(parsed.message).not.toContain('5432');
    });

    it('applies statusMessages override for 401/403', () => {
      const err = new HttpErrorResponse({
        status: 401,
        error: {
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication is required or credentials are invalid.',
        },
      });

      const parsed = parseHttpError(err, {
        statusMessages: { 401: 'Niepoprawny login lub hasło.' },
      });
      expect(parsed.message).toBe('Niepoprawny login lub hasło.');
    });

    it('supports passing fallback string directly and handles non-HttpErrorResponse errors', () => {
      expect(parseHttpError(new Error('Custom client error')).message).toBe('Custom client error');
      expect(parseHttpError('unexpected', 'Fallback string').message).toBe('Fallback string');
      expect(parseHttpError('unexpected', { fallbackMessage: 'Fallback' }).message).toBe(
        'Fallback',
      );
    });
  });
});
