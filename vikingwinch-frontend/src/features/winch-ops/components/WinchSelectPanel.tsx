import {Box, Button, CircularProgress, Typography} from '@mui/material';
import {useEffect, useState} from 'react';
import {getWinchesForSquadron} from '../api/winchClient.ts';
import {toWinch} from '../api/winchMapper.ts';
import type {Winch} from '../types/domain.ts';
import {darkBlueButton, glassPanelSx} from '../../../themes/styles.ts';
import type {SxProps, Theme} from '@mui/material/styles';

interface WinchSelectPanelProps {
    squadronId: string;
    openWinchIds: number[];
    onSelectWinch: (winchId: number) => void;
}

export const WinchSelectPanel = ({ squadronId, openWinchIds, onSelectWinch }: WinchSelectPanelProps) => {
    const [winches, setWinches] = useState<Winch[]>([]);
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
                const data = await getWinchesForSquadron(squadronId);
                if (isMounted) {
                    setWinches(data.map(toWinch));
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
                                {
                                    flexGrow: 1,
                                    flexBasis: 'calc(33.333% - 16px)',
                                    py: 2.5,
                                },
                            ] as SxProps<Theme>)}
                        >
                            Winch {winch.id}
                        </Button>
                    ))}
                </Box>
            )}
        </Box>
    );
};
