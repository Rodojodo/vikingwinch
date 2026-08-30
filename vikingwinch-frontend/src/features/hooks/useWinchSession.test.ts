import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWinchSession } from './useWinchSession';
import { postLaunchToDb, removeLaunchFromDb } from '../api/dataClient';
import { initialState } from '../state/winchReducer';
import type { LaunchResponse } from '../types';

vi.mock('../api/dataClient', () => ({
  postLaunchToDb: vi.fn(),
  removeLaunchFromDb: vi.fn(),
}));

describe('useWinchSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockResponse = (drum: 'left' | 'right', id: number, timestamp: string, burn: boolean = false): LaunchResponse => ({
    id,
    launch_number: id,
    squadron_id: initialState.squadron,
    winch_id: initialState.winchId,
    operator_id: initialState.operatorSn,
    drum,
    burn,
    timestamp,
  });

  it('initializes with default state, empty derived properties, and no error', () => {
    const { result } = renderHook(() => useWinchSession());

    expect(result.current.state).toEqual(initialState);
    expect(result.current.derived).toEqual({
      leftLaunches: 0,
      rightLaunches: 0,
      leftLast: null,
      rightLast: null,
      lastDrum: null,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('executes a successful left launch, updating normalized and derived state', async () => {
    const mockResponse = createMockResponse('left', 101, '2026-08-30T09:15:00Z');
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useWinchSession());

    await act(async () => {
      await result.current.executeLaunch('left', false);
    });

    expect(postLaunchToDb).toHaveBeenCalledTimes(1);
    expect(postLaunchToDb).toHaveBeenCalledWith({
      squadron_id: initialState.squadron,
      winch_id: initialState.winchId,
      operator_id: initialState.operatorSn,
      drum: 'left',
      burn: false,
    });

    expect(result.current.state.leftHistory).toEqual([{ id: 101, timestamp: '2026-08-30T09:15:00Z' }]);
    expect(result.current.derived.leftLaunches).toBe(1);
    expect(result.current.derived.leftLast).toBe('2026-08-30T09:15:00Z');
    expect(result.current.derived.lastDrum).toBe('left');
    expect(result.current.isLoading).toBe(false);
  });

  it('executes a successful right launch, updating normalized and derived state', async () => {
    const mockResponse = createMockResponse('right', 102, '2026-08-30T10:15:00Z');
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useWinchSession());

    await act(async () => {
      await result.current.executeLaunch('right', false);
    });

    expect(result.current.state.rightHistory).toEqual([{ id: 102, timestamp: '2026-08-30T10:15:00Z' }]);
    expect(result.current.derived.rightLaunches).toBe(1);
    expect(result.current.derived.rightLast).toBe('2026-08-30T10:15:00Z');
    expect(result.current.derived.lastDrum).toBe('right');
  });

  it('executes a burn launch, bypassing local state updates', async () => {
    const mockResponse = createMockResponse('left', 103, '2026-08-30T11:00:00Z', true);
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useWinchSession());

    await act(async () => {
      await result.current.executeLaunch('left', true);
    });

    expect(postLaunchToDb).toHaveBeenCalledWith(expect.objectContaining({ burn: true }));
    expect(result.current.state.leftHistory).toHaveLength(0);
    expect(result.current.derived.leftLaunches).toBe(0);
  });

  it('successfully undoes the last launch and recalculates derived properties', async () => {
    const mockResponse1 = createMockResponse('left', 101, '2026-08-30T09:00:00Z');
    const mockResponse2 = createMockResponse('left', 102, '2026-08-30T09:10:00Z');
    
    vi.mocked(postLaunchToDb)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);
    vi.mocked(removeLaunchFromDb).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useWinchSession());

    // Populate state with two launches
    await act(async () => {
      await result.current.executeLaunch('left', false);
      await result.current.executeLaunch('left', false);
    });

    expect(result.current.derived.leftLaunches).toBe(2);

    // Undo the top launch
    await act(async () => {
      await result.current.undoLaunch('left');
    });

    expect(removeLaunchFromDb).toHaveBeenCalledWith(102);
    expect(result.current.state.leftHistory).toEqual([{ id: 101, timestamp: '2026-08-30T09:00:00Z' }]);
    expect(result.current.derived.leftLaunches).toBe(1);
    expect(result.current.derived.leftLast).toBe('2026-08-30T09:00:00Z');
  });

  it('handles API rejection gracefully, sets error state, and throws', async () => {
    const errorMessage = 'Network timeout';
    vi.mocked(postLaunchToDb).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useWinchSession());

    await act(async () => {
      await expect(result.current.executeLaunch('left', false)).rejects.toThrow(errorMessage);
    });

    expect(result.current.state.leftHistory).toHaveLength(0);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });
  
  it('computes lastDrum correctly by comparing timestamps when both drums have history', async () => {
    const { result } = renderHook(() => useWinchSession());

    // 1. Left launch at 09:00 -> lastDrum should be left
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockResponse('left', 101, '2026-08-30T09:00:00Z'));
    await act(async () => {
      await result.current.executeLaunch('left', false);
    });
    expect(result.current.derived.lastDrum).toBe('left');

    // 2. Right launch at 10:00 -> lastDrum should be right
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockResponse('right', 102, '2026-08-30T10:00:00Z'));
    await act(async () => {
      await result.current.executeLaunch('right', false);
    });
    expect(result.current.derived.lastDrum).toBe('right');

    // 3. Left launch at 11:00 -> lastDrum should revert to left
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockResponse('left', 103, '2026-08-30T11:00:00Z'));
    await act(async () => {
      await result.current.executeLaunch('left', false);
    });
    expect(result.current.derived.lastDrum).toBe('left');
  });

  it('sets an error and aborts undoLaunch if the target drum history is empty', async () => {
    const { result } = renderHook(() => useWinchSession());

    await act(async () => {
      await result.current.undoLaunch('left'); // State is initially empty
    });

    expect(removeLaunchFromDb).not.toHaveBeenCalled();
    expect(result.current.error).toBe('No recorded launches to undo on left drum.');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles API rejection during undoLaunch, sets error state, and throws', async () => {
    // Populate state with one launch
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockResponse('right', 101, '2026-08-30T09:00:00Z'));
    const { result } = renderHook(() => useWinchSession());
    await act(async () => {
      await result.current.executeLaunch('right', false);
    });

    // Mock API failure for deletion
    const errorMessage = 'Database locked';
    vi.mocked(removeLaunchFromDb).mockRejectedValueOnce(new Error(errorMessage));

    await act(async () => {
      await expect(result.current.undoLaunch('right')).rejects.toThrow(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.state.rightHistory).toHaveLength(1); // Ensure state was not mutated
  });

  it('falls back to default error messages if executeLaunch throws a non-Error exception', async () => {
    // Mock throwing a raw string instead of an Error object
    vi.mocked(postLaunchToDb).mockRejectedValueOnce('Unexpected string exception');
    const { result } = renderHook(() => useWinchSession());

    await act(async () => {
      await expect(result.current.executeLaunch('left', false)).rejects.toEqual('Unexpected string exception');
    });

    expect(result.current.error).toBe('Launch execution failed');
  });

  it('falls back to default error messages if undoLaunch throws a non-Error exception', async () => {
    // Populate state
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockResponse('left', 101, '2026-08-30T09:00:00Z'));
    const { result } = renderHook(() => useWinchSession());
    await act(async () => {
      await result.current.executeLaunch('left', false);
    });

    // Mock throwing a raw object instead of an Error object
    vi.mocked(removeLaunchFromDb).mockRejectedValueOnce({ code: 500, status: 'FATAL' });

    await act(async () => {
      await expect(result.current.undoLaunch('left')).rejects.toEqual({ code: 500, status: 'FATAL' });
    });

    expect(result.current.error).toBe('Undo execution failed');
  });
});