import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postLaunchToDb } from '../api/dataClient'; // Adjust import path as necessary
import type { LaunchPayload } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

describe('postLaunchToDb', () => {
  const mockPayload: LaunchPayload = {
    squadron_id: '123 VGS',
    winch_id: 1,
    operator_id: 'OFF-1001',
    drum: 'left'
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('executes a POST request with correct parameters and resolves parsed JSON', async () => {
    const mockJsonResponse = { success: true, id: 101 };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockJsonResponse,
    } as Response);

    const result = await postLaunchToDb(mockPayload);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/launches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPayload),
    });
    expect(result).toStrictEqual(mockJsonResponse);
  });

  it('throws an error when the HTTP response status is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
    } as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('HTTP error: 400');
  });

  it('propagates exceptions triggered by network-level failures', async () => {
    const networkError = new Error('ECONNREFUSED');
    vi.mocked(fetch).mockRejectedValue(networkError);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('ECONNREFUSED');
  });
});