import { DEFAULT_RETURN_URL, sanitizeReturnUrl } from './return-url';

describe('sanitizeReturnUrl', () => {
  it.each([
    ['/profile', '/profile'],
    ['/users', '/users'],
    ['/users?page=2&sort=asc', '/users?page=2&sort=asc'],
    ['/profile#security', '/profile#security'],
    ['  /users  ', '/users'],
  ])('accepts valid in-app relative path %s', (input, expected) => {
    expect(sanitizeReturnUrl(input)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    '',
    '   ',
    'profile',
    'users/1',
    'https://evil.example.com',
    'http://evil.example.com/profile',
    '//evil.example.com',
    '///evil.example.com',
    '/\\evil.example.com',
    '\\evil.example.com',
    'javascript:alert(1)',
    '/\t/evil.example.com',
    '/\n/evil.example.com',
  ])('rejects unsafe returnUrl %s and falls back to /profile', (unsafeUrl) => {
    expect(sanitizeReturnUrl(unsafeUrl)).toBe(DEFAULT_RETURN_URL);
  });

  it('respects a custom fallback when provided', () => {
    expect(sanitizeReturnUrl('https://evil.example.com', '/home')).toBe('/home');
  });
});
