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

  it('returns the email nginx forwarded without calling the auth service', async () => {
    const req = {
      headers: {
        'x-authenticated-email': 'me@example.com',
        cookie: 'session=abc',
      },
    };

    await expect(getAuthenticatedEmail(req, 'workout-tracker')).resolves.toBe(
      'me@example.com',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to the auth service, forwarding the cookie and app', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        headers: { 'x-authenticated-email': 'me@example.com' },
      }),
    );

    await expect(
      getAuthenticatedEmail(
        { headers: { cookie: 'session=abc' } },
        'giant-order-tool',
      ),
    ).resolves.toBe('me@example.com');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://auth.example.test/auth/authorize',
      { headers: { cookie: 'session=abc', 'X-Auth-App': 'giant-order-tool' } },
    );
  });

  it('falls back when the forwarded header is empty', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(
      getAuthenticatedEmail(
        { headers: { 'x-authenticated-email': '' } },
        'lcruz-dev',
      ),
    ).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('returns null when the auth service sends no email', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));

    await expect(
      getAuthenticatedEmail({ headers: {} }, 'lcruz-dev'),
    ).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
      headers: { cookie: '', 'X-Auth-App': 'lcruz-dev' },
    });
  });

  it('returns null and logs when the auth service is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(
      getAuthenticatedEmail(
        { headers: { cookie: 'session=abc' } },
        'workout-tracker',
      ),
    ).resolves.toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });
});
