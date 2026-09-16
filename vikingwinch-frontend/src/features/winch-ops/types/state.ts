import type {Winch} from './domain';

export interface WinchSelectState {
    winches: Winch[];
    selectedWinchId: number | null;
    isLoading: boolean;
    error: string | null;
}

export interface DailyInspectionFormState {
    hours: number | '';
    cableCheck: string;
    isSubmitting: boolean;
    error: string | null;
}
