import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserDepartment } from './graphAPI';

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
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockJsonResponse)
    } as unknown as Response);

    const result = await getUserDepartment(mockToken);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('https://graph.microsoft.com/v1.0/me?$select=displayName,department');
    expect(options?.method).toBe('GET');
    expect(options?.headers).toBeInstanceOf(Headers);
    expect((options?.headers as Headers).get('Authorization')).toBe(`Bearer ${mockToken}`);

    expect(result).toEqual(mockJsonResponse);
  });

  it('throws an Error when response.ok is false', async () => {
    const mockToken = 'invalid_token';

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    } as unknown as Response);

    await expect(getUserDepartment(mockToken)).rejects.toThrow(
      'Failed to fetch user department from Graph API'
    );
  });
});