import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserDepartment } from './graphAPI.ts';

describe('getUserDepartment', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('executes a GET request with correct URL and Authorization header', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const mockJsonResponse = { displayName: 'Jane Doe', department: 'Engineering' };

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockJsonResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const result = await getUserDepartment(mockToken);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('https://graph.microsoft.com/v1.0/me?$select=displayName,department,employeeId');
    expect(options?.method).toBe('GET');
    expect(new Headers(options?.headers).get('Authorization')).toBe(`Bearer ${mockToken}`);

    expect(result).toEqual(mockJsonResponse);
  });

  it('throws an Error when response.ok is false', async () => {
    const mockToken = 'invalid_token';

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 401,
        statusText: 'Unauthorized',
      })
    );

    await expect(getUserDepartment(mockToken)).rejects.toThrow(
      'Failed to fetch user department from Graph API'
    );
  });
});
