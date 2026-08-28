import { describe, it, expect } from 'vitest';
import { winchReducer, initialState } from './winchReducer';
import type { WinchAction } from '../types';

describe('winchReducer', () => {
    it('returns the initial state when an unknown action is dispatched', () => {
        const action = { type: 'UNKNOWN_ACTION' } as unknown as WinchAction;
        const result = winchReducer(initialState, action);

        expect(result).toEqual(initialState);
    });

    it('processes RECORD_LEFT_LAUNCH and updates state correctly', () => {
        const timestamp = '2026-06-06 09:15:00';
        const action: WinchAction = {
            type: 'RECORD_LEFT_LAUNCH',
            payload: { timestamp }
        };

        const result = winchReducer(initialState, action);

        expect(result).toEqual({
            ...initialState,
            leftLaunches: 1,
            leftLast: timestamp,
            lastDrum: 'left'
        });
    });

    it('processes RECORD_RIGHT_LAUNCH and updates state correctly', () => {
        const timestamp = '2026-06-06 10:15:00';
        const action: WinchAction = {
            type: 'RECORD_RIGHT_LAUNCH',
            payload: { timestamp }
        };

        const result = winchReducer(initialState, action);

        expect(result).toEqual({
            ...initialState,
            rightLaunches: 1,
            rightLast: timestamp,
            lastDrum: 'right'
        });
    });

    it('accumulates multiple launches accurately over successive dispatches', () => {
        const timestamp1 = '2026-06-06 09:15:00';
        const timestamp2 = '2026-06-06 09:20:00';
        const timestamp3 = '2026-06-06 09:30:00';

        let state = winchReducer(initialState, {
            type: 'RECORD_LEFT_LAUNCH',
            payload: { timestamp: timestamp1 }
        });

        state = winchReducer(state, {
            type: 'RECORD_RIGHT_LAUNCH',
            payload: { timestamp: timestamp2 }
        });

        state = winchReducer(state, {
            type: 'RECORD_LEFT_LAUNCH',
            payload: { timestamp: timestamp3 }
        });

        expect(state.leftLaunches).toBe(2);
        expect(state.rightLaunches).toBe(1);
        expect(state.leftLast).toBe(timestamp3);
        expect(state.rightLast).toBe(timestamp2);
        expect(state.lastDrum).toBe('left');
    });
});