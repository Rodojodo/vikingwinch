import React, { useCallback, useMemo, useReducer } from 'react';
import { dayReducer, initialDayOpsState } from '../state/dayReducer';
import { postDayLogToDb } from '../api/dayOpsClient';
import { useSessionIdentity } from '../../../app/hooks/useSessionIdentity';
import { DayOpsContext } from '../hooks/useDayOps';

export interface DayOpsProviderProps {
    onDayFinished?: () => void;
    children: React.ReactNode;
}

export const DayOpsProvider: React.FC<DayOpsProviderProps> = ({ onDayFinished, children }) => {
    const [state, dispatch] = useReducer(dayReducer, initialDayOpsState);
    const { winchId, squadronId, operatorSn } = useSessionIdentity();

    const finishDay = useCallback(async (hours: number | null = null) => {
        if (!winchId || !squadronId || !operatorSn) {
            throw new Error('Incomplete session identity for finishDay');
        }
        await postDayLogToDb({
            squadron_id: squadronId,
            winch_id: winchId,
            operator_sn: operatorSn,
            trainee: null,
            type: 'finish_day',
            hours,
        });
        dispatch({ type: 'FINISH_DAY' });
        onDayFinished?.();
    }, [winchId, squadronId, operatorSn, onDayFinished]);

    const recordSignOn = useCallback(async (traineeSn: string | null) => {
        if (!winchId || !squadronId || !operatorSn) {
            throw new Error('Incomplete session identity for sign on');
        }
        await postDayLogToDb({
            squadron_id: squadronId,
            winch_id: winchId,
            operator_sn: operatorSn,
            trainee: traineeSn,
            type: 'sign_on',
            hours: null,
        });
        dispatch({ type: 'RECORD_SIGN_ON', payload: { operatorSn, traineeSn } });
    }, [winchId, squadronId, operatorSn]);

    const recordDI = useCallback(async (hours: number | null = null) => {
        if (!winchId || !squadronId || !operatorSn) {
            throw new Error('Incomplete session identity for DI');
        }
        await postDayLogToDb({
            squadron_id: squadronId,
            winch_id: winchId,
            operator_sn: operatorSn,
            trainee: null,
            type: 'di',
            hours,
        });
        dispatch({ type: 'RECORD_DI' });
    }, [winchId, squadronId, operatorSn]);

    const recordCableCheck = useCallback(async () => {
        if (!winchId || !squadronId || !operatorSn) {
            throw new Error('Incomplete session identity for cable check');
        }
        await postDayLogToDb({
            squadron_id: squadronId,
            winch_id: winchId,
            operator_sn: operatorSn,
            trainee: null,
            type: 'cable_check',
            hours: null,
        }, winchId);
    }, [winchId, squadronId, operatorSn]);

    const resetDay = useCallback(() => {
        dispatch({ type: 'RESET_DAY' });
    }, []);

    const value = useMemo(() => ({
        dayFinished: state.dayFinished,
        signedOn: state.signedOn,
        diCompleted: state.diCompleted,
        lastOperatorSn: state.lastOperatorSn,
        lastTraineeSn: state.lastTraineeSn,
        finishDay,
        recordSignOn,
        recordDI,
        recordCableCheck,
        resetDay,
    }), [
        state.dayFinished,
        state.signedOn,
        state.diCompleted,
        state.lastOperatorSn,
        state.lastTraineeSn,
        finishDay,
        recordSignOn,
        recordDI,
        recordCableCheck,
        resetDay,
    ]);

    return (
        <DayOpsContext.Provider value={value}>
            {children}
        </DayOpsContext.Provider>
    );
};
