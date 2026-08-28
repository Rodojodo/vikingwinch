import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWinchSession } from './useWinchSession';
import { postLaunchToDb } from '../api/dataClient';
import { initialState } from '../state/winchReducer';

vi.mock('../api/dataClient.ts', () => ({
    postLaunchToDb: vi.fn(),
}));

describe('useWinchSession', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with default state, loading false, and no error', () => {
        const { result } = renderHook(() => useWinchSession());

        expect(result.current.state).toEqual(initialState);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('executes a successful left launch and updates state', async () => {
        const mockTimestamp = '2026-06-06 09:15:00';
        const mockResponse = { timestamp: mockTimestamp };
        vi.mocked(postLaunchToDb).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useWinchSession());

        await act(async () => {
            await result.current.executeLaunch('left');
        });

        expect(postLaunchToDb).toHaveBeenCalledTimes(1);
        expect(postLaunchToDb).toHaveBeenCalledWith({
            squadron_id: initialState.squadron,
            winch_id: initialState.winchId,
            operator_id: initialState.operatorSn,
            drum: 'left',
        });

        expect(result.current.state.leftLaunches).toBe(1);
        expect(result.current.state.leftLast).toBe(mockTimestamp);
        expect(result.current.state.lastDrum).toBe('left');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('executes a successful right launch and updates state', async () => {
        const mockTimestamp = '2026-06-06 10:15:00';
        const mockResponse = { timestamp: mockTimestamp };
        vi.mocked(postLaunchToDb).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useWinchSession());

        await act(async () => {
            await result.current.executeLaunch('right');
        });

        expect(postLaunchToDb).toHaveBeenCalledTimes(1);
        expect(postLaunchToDb).toHaveBeenCalledWith({
            squadron_id: initialState.squadron,
            winch_id: initialState.winchId,
            operator_id: initialState.operatorSn,
            drum: 'right',
        });

        expect(result.current.state.rightLaunches).toBe(1);
        expect(result.current.state.rightLast).toBe(mockTimestamp);
        expect(result.current.state.lastDrum).toBe('right');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('handles API rejection and sets error state without mutating log state', async () => {
        const errorMessage = 'Network timeout';
        vi.mocked(postLaunchToDb).mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useWinchSession());

        await act(async () => {
            await result.current.executeLaunch('left');
        });

        expect(postLaunchToDb).toHaveBeenCalledTimes(1);

        expect(result.current.state).toEqual(initialState);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
    });
});