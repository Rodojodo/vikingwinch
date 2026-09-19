import React, {useEffect, useState} from 'react';
import {Box, Button, CircularProgress, Typography} from '@mui/material';
import type {SxProps, Theme} from '@mui/material/styles';
import type {Winch, WinchRead} from '../types';
import {getWinchesForSquadron} from '../api/winchClient';
import {exportWinchLogsheet, getTodayDateString, getWinchDayStatus} from '../../../app/utils/exportWinchLog';
import {darkBlueButton, elevatedPanel, errorBannerSx, warningBannerSx} from '../../../themes/styles';

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
    const [unfinishedWinchIds, setUnfinishedWinchIds] = useState<number[]>([]);

    const loadingWinches = winchesProp === undefined && fetchedSquadronId !== squadronId;
    const winches = winchesProp ?? (fetchedSquadronId === squadronId ? fetchedWinches : EMPTY_WINCHES);

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
        if (loadingWinches || winches.length === 0) return;

        let isMounted = true;
        const todayStr = getTodayDateString();
        const controller = new AbortController();

        Promise.allSettled(winches.map(w => getWinchDayStatus(w.id, todayStr, controller.signal))).then(results => {
            if (!isMounted) return;
            const unfinished: number[] = [];
            results.forEach((res, idx) => {
                if (res.status === 'fulfilled' && res.value.hasUnfinishedDay) {
                    unfinished.push(winches[idx].id);
                }
            });
            setUnfinishedWinchIds(unfinished);
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
    const displayedUnfinished = unfinishedWinchIds.filter(id => activeWinchIds.has(id));

    return (
        <Box
            data-testid="logsheet-export-panel"
            sx={([
                elevatedPanel,
                {
                    width: '100%',
                    boxSizing: 'border-box',
                    mt: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                },
            ] as SxProps<Theme>)}
        >
            <Typography variant="h3" sx={{mb: 1, textAlign: 'center'}}>
                Export Logsheet
            </Typography>

            {displayedUnfinished.map(id => (
                <Typography key={id} variant="body2" sx={warningBannerSx} role="alert">
                    Winch {id} has launches, but day not finished
                </Typography>
            ))}

            {exportError && (
                <Typography variant="body2" sx={errorBannerSx} role="alert">
                    {exportError}
                </Typography>
            )}

            {loadingWinches ? (
                <CircularProgress size={28} color="inherit" />
            ) : winches.length === 0 ? (
                <Typography color="text.secondary">No winches available for export.</Typography>
            ) : (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%'}}>
                    {winches.map(winch => {
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
                                    `Export Logsheet ${winch.id}`
                                )}
                            </Button>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};
