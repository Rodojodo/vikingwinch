export type PanelType = 'remarks' | 'repairs' | null;

export interface DrumLaunchTarget {
    id: number;
}

export interface DrumLaunchStatus {
    leftLastRecord?: DrumLaunchTarget | null;
    rightLastRecord?: DrumLaunchTarget | null;
}
