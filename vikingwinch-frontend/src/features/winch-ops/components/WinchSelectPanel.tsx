import {Box, Button, CircularProgress, Typography} from '@mui/material';
import {useEffect, useState} from 'react';
import {getWinchStatusesForSquadron} from '../api/winchClient.ts';
import {toWinchWithStatus} from '../api/winchMapper.ts';
import type {WinchWithStatus} from '../types/domain.ts';
import {darkBlueButton, glassPanelSx} from '../../../themes/styles.ts';
import type {SxProps, Theme} from '@mui/material/styles';

interface WinchSelectPanelProps {
    squadronId: string;
    openWinchIds: number[];
    onSelectWinch: (winchId: number) => void;
}

export const WinchSelectPanel = ({ squadronId, openWinchIds, onSelectWinch }: WinchSelectPanelProps) => {
    const [winches, setWinches] = useState<WinchWithStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [prevSquadronId, setPrevSquadronId] = useState(squadronId);

    if (squadronId !== prevSquadronId) {
        setPrevSquadronId(squadronId);
        setLoading(true);
        setError(null);
    }

    useEffect(() => {
        let isMounted = true;
        const fetchWinches = async () => {
            try {
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const data = await getWinchStatusesForSquadron(squadronId, todayStr);
                if (isMounted) {
                    setWinches(data.map(toWinchWithStatus));
                    setLoading(false);
                }
            } catch {
                if (isMounted) {
                    setError('Failed to load winches');
                    setLoading(false);
                }
            }
        };

        fetchWinches();
        return () => {
            isMounted = false;
        };
    }, [squadronId]);

    const availableWinches = winches.filter(winch => !openWinchIds.includes(winch.id));

    const statusLabel = (status: WinchWithStatus['status']) => {
        if (status === 'di_complete') return 'DI Complete';
        if (status === 'in_use') return 'In use';
        if (status === 'day_finished') return 'Day finished';
        return null;
    };

    const statusButtonSx = (status: WinchWithStatus['status']): SxProps<Theme> => {
        if (status === 'day_finished') {
            return {
                backgroundColor: '#7C3AED',
                borderColor: '#7C3AED',
                color: '#ffffff',
                '&:hover': {backgroundColor: '#6D28D9', borderColor: '#6D28D9'},
            };
        }
        if (status === 'di_complete' || status === 'in_use') {
            return {
                backgroundColor: '#D9770614',
                borderColor: '#D97706',
                color: '#ffffff',
                '&:hover': {backgroundColor: '#D97706', borderColor: '#D97706'},
            };
        }
        return {};
    };

    return (
        <Box sx={[glassPanelSx, {maxWidth: 540, gap: 3}] as SxProps<Theme>}>
            <Typography variant="h2" sx={{mb: 1}}>
                Select a Winch
            </Typography>

            {loading ? (
                <CircularProgress color="inherit" />
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : availableWinches.length === 0 ? (
                <Typography>No winches available for this squadron.</Typography>
            ) : (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%'}}>
                    {availableWinches.map(winch => (
                        <Button
                            key={winch.id}
                            variant="outlined"
                            onClick={() => onSelectWinch(winch.id)}
                            sx={([
                                darkBlueButton,
                                statusButtonSx(winch.status),
                                {
                                    flexGrow: 1,
                                    flexBasis: 'calc(33.333% - 16px)',
                                    py: 2.5,
                                },
                            ] as SxProps<Theme>)}
                        >
                            <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                <Typography component="span" sx={{fontWeight: 700}}>
                                    Winch {winch.id}
                                </Typography>
                                {statusLabel(winch.status) && (
                                    <Typography component="span" variant="caption" sx={{mt: 0.5}}>
                                        {statusLabel(winch.status)}
                                    </Typography>
                                )}
                            </Box>
                        </Button>
                    ))}
                </Box>
            )}
        </Box>
    );
};
