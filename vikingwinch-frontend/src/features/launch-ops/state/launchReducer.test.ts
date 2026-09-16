import { describe, it, expect } from 'vitest';
import { launchReducer, initialLaunchState, type LaunchState, type LaunchAction } from './launchReducer';
import type { LaunchResponse } from '../types';

describe('launchReducer', () => {
    const baseResponse: LaunchResponse = {
        id: 1,
        launch_number: 10,
        timestamp: '2026-09-16T09:00:00Z',
        drum: 'left',
        operator_sn: 'OP-123',
        squadron_id: '621 VGS',
        winch_id: 1,
        cable_id: null,
        created_at: '2026-09-16T09:00:00Z',
        day: '2026-09-16',
        remark: null,
    };

    it('returns default initial state for unknown action', () => {
        const state = launchReducer(initialLaunchState, { type: 'UNKNOWN' as any } as LaunchAction);
        expect(state).toEqual(initialLaunchState);
    });

    describe('RECORD_LAUNCH', () => {
        it('appends normal launch to leftHistory with burn false', () => {
            const state = launchReducer(initialLaunchState, {
                type: 'RECORD_LAUNCH',
                payload: { ...baseResponse, drum: 'left', launch_number: 1 },
            });

            expect(state.leftHistory).toHaveLength(1);
            expect(state.leftHistory[0]).toEqual({
                id: 1,
                launch_number: 1,
                timestamp: '2026-09-16T09:00:00Z',
                remark: null,
                burn: false,
                operator_sn: 'OP-123',
            });
            expect(state.rightHistory).toHaveLength(0);
        });

        it('appends burn launch (null launch_number) to rightHistory with burn true', () => {
            const state = launchReducer(initialLaunchState, {
                type: 'RECORD_LAUNCH',
                payload: { ...baseResponse, id: 2, drum: 'right', launch_number: null },
            });

            expect(state.rightHistory).toHaveLength(1);
            expect(state.rightHistory[0]).toEqual({
                id: 2,
                launch_number: null,
                timestamp: '2026-09-16T09:00:00Z',
                remark: null,
                burn: true,
                operator_sn: 'OP-123',
            });
            expect(state.leftHistory).toHaveLength(0);
        });
    });

    describe('UNDO_LAUNCH', () => {
        const prefilledState: LaunchState = {
            leftHistory: [
                { id: 1, launch_number: 1, timestamp: '10:00', remark: null, burn: false, operator_sn: 'OP1' },
                { id: 2, launch_number: 2, timestamp: '10:15', remark: null, burn: false, operator_sn: 'OP1' },
            ],
            rightHistory: [
                { id: 3, launch_number: 3, timestamp: '10:10', remark: null, burn: false, operator_sn: 'OP1' },
            ],
        };

        it('removes the last entry from leftHistory', () => {
            const state = launchReducer(prefilledState, {
                type: 'UNDO_LAUNCH',
                payload: { drum: 'left' },
            });

            expect(state.leftHistory).toHaveLength(1);
            expect(state.leftHistory[0].id).toBe(1);
            expect(state.rightHistory).toHaveLength(1);
        });

        it('removes the last entry from rightHistory', () => {
            const state = launchReducer(prefilledState, {
                type: 'UNDO_LAUNCH',
                payload: { drum: 'right' },
            });

            expect(state.rightHistory).toHaveLength(0);
            expect(state.leftHistory).toHaveLength(2);
        });

        it('handles undo when history is already empty', () => {
            const state = launchReducer(initialLaunchState, {
                type: 'UNDO_LAUNCH',
                payload: { drum: 'left' },
            });

            expect(state.leftHistory).toEqual([]);
        });
    });

    describe('HYDRATE_HISTORY', () => {
        it('hydrates left and right histories separating drums and marking burns', () => {
            const items: LaunchResponse[] = [
                { ...baseResponse, id: 1, drum: 'left', launch_number: 1 },
                { ...baseResponse, id: 2, drum: 'right', launch_number: null },
                { ...baseResponse, id: 3, drum: 'left', launch_number: 2, remark: 'Cable knot' },
            ];

            const state = launchReducer(initialLaunchState, {
                type: 'HYDRATE_HISTORY',
                payload: { sorted: items },
            });

            expect(state.leftHistory).toHaveLength(2);
            expect(state.leftHistory[0].id).toBe(1);
            expect(state.leftHistory[0].burn).toBe(false);
            expect(state.leftHistory[1].id).toBe(3);
            expect(state.leftHistory[1].remark).toBe('Cable knot');

            expect(state.rightHistory).toHaveLength(1);
            expect(state.rightHistory[0].id).toBe(2);
            expect(state.rightHistory[0].burn).toBe(true);
        });
    });

    describe('ADD_REMARK', () => {
        const prefilledState: LaunchState = {
            leftHistory: [
                { id: 10, launch_number: 1, timestamp: '10:00', remark: null, burn: false, operator_sn: 'OP1' },
                { id: 20, launch_number: 2, timestamp: '10:15', remark: null, burn: false, operator_sn: 'OP1' },
            ],
            rightHistory: [
                { id: 30, launch_number: 3, timestamp: '10:10', remark: null, burn: false, operator_sn: 'OP1' },
            ],
        };

        it('adds remark to specified launch on left drum', () => {
            const state = launchReducer(prefilledState, {
                type: 'ADD_REMARK',
                payload: { drum: 'left', id: 20, remark: 'Weak link replaced' },
            });

            expect(state.leftHistory[1].remark).toBe('Weak link replaced');
            expect(state.leftHistory[0].remark).toBeNull();
        });

        it('adds remark to specified launch on right drum', () => {
            const state = launchReducer(prefilledState, {
                type: 'ADD_REMARK',
                payload: { drum: 'right', id: 30, remark: 'Slow retrieve' },
            });

            expect(state.rightHistory[0].remark).toBe('Slow retrieve');
        });

        it('leaves history unchanged if id is not found', () => {
            const state = launchReducer(prefilledState, {
                type: 'ADD_REMARK',
                payload: { drum: 'left', id: 999, remark: 'Non-existent' },
            });

            expect(state.leftHistory).toEqual(prefilledState.leftHistory);
        });
    });
});
