import {Box, Button, CircularProgress, Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {getWinchesForSquadron} from '../api/winchOpsClient';
import type {WinchRead} from '../types/winchOpsTypes';
import {darkBlueButton, glassPanelSx} from "../../../themes/styles.ts";
import type {SxProps, Theme} from '@mui/material/styles';

interface WinchSelectPanelProps {
    squadronId: string;
    openWinchIds: number[];
    onSelectWinch: (winchId: number) => void;
}

export const WinchSelectPanel = ({ squadronId, openWinchIds, onSelectWinch }: WinchSelectPanelProps) => {
    const [winches, setWinches] = useState<WinchRead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWinches = async () => {
            try {
                setLoading(true);
                const data = await getWinchesForSquadron(squadronId);
                setWinches(data);
            } catch (err) {
                setError("Failed to load winches");
            } finally {
                setLoading(false);
            }
        };
        
        fetchWinches();
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
                            sx={[
                                darkBlueButton as any,
                                {
                                    flexGrow: 1,
                                    flexBasis: 'calc(33.333% - 16px)',
                                    py: 2.5,
                                }
                            ]}
                        >
                            Winch {winch.id}
                        </Button>
                    ))}
                </Box>
            )}
        </Box>
    );
};
