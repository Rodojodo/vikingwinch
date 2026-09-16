import {describe, expect, it} from 'vitest';
import {initialTraineeState, type TraineeAction, traineeReducer} from './traineeReducer';

describe('traineeReducer', () => {
    it('returns default initial state for unknown action', () => {
        const unknownAction = {type: 'UNKNOWN'} as unknown as TraineeAction;
        const state = traineeReducer(initialTraineeState, unknownAction);
        expect(state).toEqual(initialTraineeState);
    });

    describe('SET_TRAINEE', () => {
        it('sets trainee and resets active launcher to operator', () => {
            const state = traineeReducer(initialTraineeState, {
                type: 'SET_TRAINEE',
                payload: {
                    traineeSn: 'TR-5678',
                    operatorSn: 'OP-1234',
                },
            });

            expect(state.traineeSn).toBe('TR-5678');
            expect(state.activeLauncherSn).toBe('OP-1234');
        });

        it('clears trainee when traineeSn is null and sets active launcher to operator', () => {
            const modifiedState = {
                traineeSn: 'TR-5678',
                activeLauncherSn: 'TR-5678',
            };

            const state = traineeReducer(modifiedState, {
                type: 'SET_TRAINEE',
                payload: {
                    traineeSn: null,
                    operatorSn: 'OP-1234',
                },
            });

            expect(state.traineeSn).toBeNull();
            expect(state.activeLauncherSn).toBe('OP-1234');
        });
    });

    describe('SET_ACTIVE_LAUNCHER', () => {
        it('switches active launcher to specified service number', () => {
            const state = traineeReducer(
                { traineeSn: 'TR-5678', activeLauncherSn: 'OP-1234' },
                { type: 'SET_ACTIVE_LAUNCHER', payload: 'TR-5678' }
            );

            expect(state.activeLauncherSn).toBe('TR-5678');
            expect(state.traineeSn).toBe('TR-5678');
        });
    });
});
