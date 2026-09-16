import { createContext, useContext } from 'react';
import type { DrumPosition } from '../../../core/types';
import type { DerivedWinchState, LaunchRecord, LaunchResponse } from '../types';

export interface LaunchOpsContextType {
    leftHistory: LaunchRecord[];
    rightHistory: LaunchRecord[];
    derived: DerivedWinchState;
    executeLaunch: (drum: DrumPosition, burn?: boolean, traineeSnOverride?: string | null) => Promise<void>;
    undoLaunch: (drum: DrumPosition) => Promise<void>;
    hydrateHistory: (launches: LaunchResponse[]) => void;
    addRemarkToState: (drum: DrumPosition, id: number, remark: string | null) => void;
}

export const LaunchOpsContext = createContext<LaunchOpsContextType | null>(null);

export const useLaunchOps = (): LaunchOpsContextType => {
    const context = useContext(LaunchOpsContext);
    if (!context) {
        throw new Error('useLaunchOps must be used within LaunchOpsProvider');
    }
    return context;
};
