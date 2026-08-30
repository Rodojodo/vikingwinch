import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postLaunchToDb, removeLaunchFromDb } from '../api/dataClient';
import type { LaunchPayload, LaunchResponse } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

describe('postLaunchToDb', () => {
  const mockPayload: LaunchPayload = {
    squadron_id: '123 VGS',
    winch_id: 1,
    operator_id: 'OFF-1001',
    drum: 'left',
    burn: false,
  };

  const mockResponse: LaunchResponse = {
    id: 101,
    launch_number: 42,
    squadron_id: '123 VGS',
    winch_id: 1,
    operator_id: 'OFF-1001',
    drum: 'left',
    burn: false,
    timestamp: '2026-08-30T10:00:00Z',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('executes a POST request with payload (including burn) and resolves parsed response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
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
    expect(result).toStrictEqual(mockResponse);
  });

  it('handles a burn launch payload correctly', async () => {
    const burnPayload: LaunchPayload = { ...mockPayload, burn: true };
    const burnResponse: LaunchResponse = { ...mockResponse, burn: true };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => burnResponse,
    } as Response);

    const result = await postLaunchToDb(burnPayload);

    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/launches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(burnPayload),
    });
    expect(result.burn).toBe(true);
  });

  it('throws backend detail message when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Invalid winch configuration' }),
    } as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('Invalid winch configuration');
  });

  it('falls back to HTTP status when backend returns unparseable error response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Unexpected token < in JSON at position 0');
      },
    } as unknown as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('HTTP error: 500');
  });

  it('propagates network-level errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network connection lost'));

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('Network connection lost');
  });
});

describe('removeLaunchFromDb', () => {
  const targetLaunchId = 101;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('executes a DELETE request targeting launch ID and resolves cleanly on 204', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    await expect(removeLaunchFromDb(targetLaunchId)).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/launches/${targetLaunchId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
  });

  it('throws backend detail message when delete fails with 404', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: `Launch with id ${targetLaunchId} not found` }),
    } as Response);

    await expect(removeLaunchFromDb(targetLaunchId)).rejects.toThrow(
      `Launch with id ${targetLaunchId} not found`
    );
  });

  it('falls back to HTTP status when deletion error response has no JSON body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Bad Gateway');
      },
    } as unknown as Response);

    await expect(removeLaunchFromDb(targetLaunchId)).rejects.toThrow('HTTP error: 502');
  });

  it('propagates network-level errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(removeLaunchFromDb(targetLaunchId)).rejects.toThrow('ECONNREFUSED');
  });
});