export interface Winch {
    id: number;
    registration: string;
    squadronId: string;
}

export type TabView = 'loading' | 'select_winch' | 'inspection' | 'sign_on' | 'launch' | 'skylog';
