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
                <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, width: '100%', justifyContent: 'center' }}>
                    {winches.map(winch => (
                        <Button
                            key={winch.id}
                            variant="outlined"
                            onClick={() => onSelectWinch(winch.id)}
                            sx={{
                                flex: 1,
                                minWidth: '120px',
                                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                border: '2px solid #3b82f6',
                                color: '#f8fafc',
                                textTransform: 'none',
                                borderRadius: '16px',
                                py: 2.5,
                                px: 2,
                                fontSize: '16px',
                                fontWeight: 600,
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.5)',
                                    borderColor: 'transparent'
                                },
                                '&:disabled': {
                                    opacity: 0.5,
                                    color: 'rgba(255, 255, 255, 0.3)',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
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
