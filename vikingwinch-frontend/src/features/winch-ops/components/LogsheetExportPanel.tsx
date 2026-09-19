import React, {useEffect, useState} from 'react';
import {Box, Button, CircularProgress, Typography} from '@mui/material';
import type {SxProps, Theme} from '@mui/material/styles';
import type {Winch, WinchRead} from '../types';
import {getWinchesForSquadron} from '../api/winchClient';
import {exportWinchLogsheet, getTodayDateString, getWinchDayStatus} from '../../../app/utils/exportWinchLog';
import {darkBlueButton, errorBannerSx, glassPanelSx, warningBannerSx} from '../../../themes/styles';

export interface LogsheetExportPanelProps {
    squadronId: string;
    winches?: Winch[];
    onExport?: (winchId: number) => Promise<void>;
}

const EMPTY_WINCHES: Winch[] = [];

const toWinch = (w: WinchRead): Winch => ({
    id: w.id,
    registration: w.registration ?? '',
    squadronId: w.squadron_id,
});

export const LogsheetExportPanel: React.FC<LogsheetExportPanelProps> = ({
    squadronId,
    winches: winchesProp,
    onExport,
}) => {
    const [fetchedWinches, setFetchedWinches] = useState<Winch[]>([]);
    const [fetchedSquadronId, setFetchedSquadronId] = useState<string | null>(null);
    const [exportingWinchId, setExportingWinchId] = useState<number | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [fetchedStatuses, setFetchedStatuses] = useState<{
        finished: number[];
        unfinished: number[];
    } | null>(null);
    const [prevSqnForStatus, setPrevSqnForStatus] = useState(squadronId);

    if (squadronId !== prevSqnForStatus) {
        setPrevSqnForStatus(squadronId);
        setFetchedStatuses(null);
    }

    const loadingWinches = winchesProp === undefined && fetchedSquadronId !== squadronId;
    const winches = winchesProp ?? (fetchedSquadronId === squadronId ? fetchedWinches : EMPTY_WINCHES);
    const loadingStatus = !loadingWinches && winches.length > 0 && fetchedStatuses === null;
    const finishedWinchIds = fetchedStatuses?.finished ?? [];
    const unfinishedWinchIds = fetchedStatuses?.unfinished ?? [];

    useEffect(() => {
        if (winchesProp !== undefined) {
            return;
        }

        let isMounted = true;
        const fetchWinches = async () => {
            try {
                const data = await getWinchesForSquadron(squadronId);
                if (isMounted) {
                    setFetchedWinches(data.map(toWinch));
                    setFetchedSquadronId(squadronId);
                }
            } catch {
                if (isMounted) {
                    setFetchedWinches([]);
                    setFetchedSquadronId(squadronId);
                }
            }
        };

        void fetchWinches();

        return () => {
            isMounted = false;
        };
    }, [squadronId, winchesProp]);

    useEffect(() => {
        if (loadingWinches || winches.length === 0) {
            return;
        }

        let isMounted = true;
        const todayStr = getTodayDateString();
        const controller = new AbortController();

        Promise.allSettled(winches.map(w => getWinchDayStatus(w.id, todayStr, controller.signal))).then(results => {
            if (!isMounted) return;
            const finished: number[] = [];
            const unfinished: number[] = [];

            results.forEach((res, idx) => {
                if (res.status === 'fulfilled') {
                    if (res.value.hasFinishDay) {
                        finished.push(winches[idx].id);
                    }
                    if (res.value.hasUnfinishedDay) {
                        unfinished.push(winches[idx].id);
                    }
                }
            });

            setFetchedStatuses({finished, unfinished});
        });

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [loadingWinches, winches, squadronId]);

    const handleExport = async (winchId: number) => {
        setExportError(null);
        setExportingWinchId(winchId);
        try {
            if (onExport) {
                await onExport(winchId);
            } else {
                await exportWinchLogsheet(winchId, squadronId);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Log export failed. Please check your connection and try again.';
            setExportError(message);
        } finally {
            setExportingWinchId(null);
        }
    };

    const activeWinchIds = new Set(winches.map(w => w.id));
    const displayedFinished = winches.filter(w => finishedWinchIds.includes(w.id));
    const displayedUnfinished = unfinishedWinchIds.filter(id => activeWinchIds.has(id));

    return (
        <Box
            data-testid="logsheet-export-panel"
            sx={([
                glassPanelSx,
                {
                    width: '100%',
                    maxWidth: 540,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    p: 3,
                },
            ] as SxProps<Theme>)}
        >
            {exportError && (
                <Typography variant="body2" sx={errorBannerSx} role="alert">
                    {exportError}
                </Typography>
            )}

            {loadingWinches || loadingStatus ? (
                <CircularProgress size={28} color="inherit" />
            ) : winches.length === 0 ? (
                <Typography color="text.secondary">No winches available for export.</Typography>
            ) : displayedFinished.length === 0 && displayedUnfinished.length === 0 ? (
                <Typography color="text.secondary">No logsheets ready for export.</Typography>
            ) : (
                <>
                    {displayedFinished.length > 0 && (
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%'}}>
                            {displayedFinished.map(winch => {
                                const isExporting = exportingWinchId === winch.id;
                                return (
                                    <Button
                                        key={winch.id}
                                        variant="outlined"
                                        aria-label={isExporting ? `Exporting logsheet ${winch.id}` : undefined}
                                        disabled={exportingWinchId !== null}
                                        onClick={() => handleExport(winch.id)}
                                        sx={([
                                            darkBlueButton,
                                            {
                                                flexGrow: 1,
                                                flexBasis: 'calc(50% - 8px)',
                                                py: 2,
                                            },
                                        ] as SxProps<Theme>)}
                                    >
                                        {isExporting ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            `Export Winch ${winch.id}`
                                        )}
                                    </Button>
                                );
                            })}
                        </Box>
                    )}

                    {displayedUnfinished.map(id => (
                        <Typography key={id} variant="body2" sx={warningBannerSx} role="alert">
                            Winch {id} has launches but day not finished
                        </Typography>
                    ))}
                </>
            )}
        </Box>
    );
};
