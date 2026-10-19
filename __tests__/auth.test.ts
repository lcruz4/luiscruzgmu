import { getAuthenticatedEmail } from '@/services/auth';
import { logger } from '@/services/logger';

describe('getAuthenticatedEmail', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env.NEXT_PUBLIC_AUTH_DOMAIN = 'https://auth.example.test';
    fetchMock.mockReset();
    global.fetch = fetchMock;
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the email from the auth header and forwards the cookie', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        headers: { 'x-authenticated-email': 'me@example.com' },
      }),
    );

    await expect(getAuthenticatedEmail('session=abc')).resolves.toBe(
      'me@example.com',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://auth.example.test/auth/authorize',
      { headers: { cookie: 'session=abc' } },
    );
  });

  it('returns null when the header is missing', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(getAuthenticatedEmail(undefined)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
      headers: { cookie: '' },
    });
  });

  it('returns null and logs when the auth service is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(getAuthenticatedEmail('session=abc')).resolves.toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });
});
