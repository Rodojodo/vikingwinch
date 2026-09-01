import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { getWinchesForSquadron } from "../api/dataClient";
import type { WinchRead } from "../types";

interface WinchSelectPanelProps {
    squadronId: string;
    onSelectWinch: (winchId: number) => void;
}

export const WinchSelectPanel = ({ squadronId, onSelectWinch }: WinchSelectPanelProps) => {
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

    return (
        <Box sx={{
            p: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: 540,
            position: 'relative'
        }}>
            <Typography variant="h5" fontWeight="bold">
                Select a Winch
            </Typography>

            {loading ? (
                <CircularProgress color="inherit" />
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : winches.length === 0 ? (
                <Typography>No winches available for this squadron.</Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                    {winches.map(winch => (
                        <Button
                            key={winch.id}
                            variant="outlined"
                            onClick={() => onSelectWinch(winch.id)}
                            sx={{
                                color: 'white',
                                borderColor: 'rgba(56, 189, 248, 0.5)',
                                borderRadius: '12px',
                                py: 2,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                '&:hover': {
                                    borderColor: 'rgba(56, 189, 248, 1)',
                                    backgroundColor: 'rgba(56, 189, 248, 0.1)'
                                }
                            }}
                        >
                            Winch {winch.id}
                        </Button>
                    ))}
                </Box>
            )}
        </Box>
    );
};
