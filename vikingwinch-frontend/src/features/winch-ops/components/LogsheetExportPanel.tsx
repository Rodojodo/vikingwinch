import React, {useEffect, useState} from 'react';
import {Box, Button, CircularProgress, Typography} from '@mui/material';
import type {SxProps, Theme} from '@mui/material/styles';
import type {Winch, WinchRead} from '../types';
import {getExportData, getWinchDayStatus, getWinchesForSquadron} from '../api/winchClient';
import {exportLog, getTodayDateString} from '../../../app/utils/exportLog';
import {errorBannerSx, glassPanelSx, warningBannerSx} from '../../../themes/styles';

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

            results.forEach((res) => {
                if (res.status === 'fulfilled') {
                    if (res.value.has_finish_day) {
                        finished.push(res.value.winch_id);
                    } else if (res.value.has_launches) {
                        unfinished.push(res.value.winch_id);
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
                const todayStr = getTodayDateString();
                const data = await getExportData(winchId, squadronId, todayStr);
                await exportLog(data, todayStr);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Log export failed. Please check your connection and try again.';
            setExportError(message);
        } finally {
            setExportingWinchId(null);
        }
    };

    const hasNoWinches = !loadingWinches && winches.length === 0;
    const hasItemsToDisplay = finishedWinchIds.length > 0 || unfinishedWinchIds.length > 0;
    const isExportingAny = exportingWinchId !== null;

    const panelSx: SxProps<Theme> = {
        ...glassPanelSx,
        width: '100%',
        maxWidth: 540,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
    };

    return (
        <Box sx={panelSx}>
            <Typography variant="h2" sx={{mb: 1}}>
                Export Logsheets
            </Typography>

            {exportError && (
                <Box sx={{...errorBannerSx, mb: 2}}>
                    <Typography variant="body2">{exportError}</Typography>
                </Box>
            )}

            {loadingWinches || loadingStatus ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 3}}>
                    <CircularProgress size={28}/>
                </Box>
            ) : hasNoWinches ? (
                <Typography variant="body1" color="text.secondary" sx={{py: 1}}>
                    No winches available for export.
                </Typography>
            ) : (
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1}}>
                    {unfinishedWinchIds.map(wId => (
                        <Box key={`unfinished-${wId}`} sx={warningBannerSx}>
                            <Typography variant="body2">
                                Winch {wId} has launches but day not finished
                            </Typography>
                        </Box>
                    ))}

                    {finishedWinchIds.map(wId => (
                        <Button
                            key={`export-${wId}`}
                            variant="contained"
                            color="primary"
                            onClick={() => void handleExport(wId)}
                            disabled={isExportingAny}
                            aria-label={exportingWinchId === wId ? `Exporting logsheet ${wId}` : `Export Winch ${wId}`}
                            sx={{
                                borderRadius: 2,
                                py: 1.5,
                            }}
                        >
                            {exportingWinchId === wId ? (
                                <CircularProgress size={24} color="inherit"/>
                            ) : (
                                `Export Winch ${wId}`
                            )}
                        </Button>
                    ))}

                    {!hasItemsToDisplay && (
                        <Typography variant="body1" color="text.secondary" sx={{py: 1}}>
                            No logsheets ready for export.
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};
