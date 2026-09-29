export interface Winch {
    id: number;
    registration: string;
    squadronId: string;
}

export type WinchStatus = 'default' | 'di_complete' | 'in_use' | 'day_finished';

export interface WinchWithStatus extends Winch {
    status: WinchStatus;
}

export type TabView = 'loading' | 'select_winch' | 'inspection' | 'sign_on' | 'launch' | 'skylog';
