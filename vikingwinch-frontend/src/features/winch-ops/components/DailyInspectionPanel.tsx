import React, { useState } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import { getWinchDrums, getWinchHours, postDayLogToDb } from '../api/dataClient.ts';
import { useWinchSession } from '../hooks/useWinchSession.ts';

interface DailyInspectionPanelProps {
    session: ReturnType<typeof useWinchSession>;
    onComplete: () => void;
}

export const DailyInspectionPanel: React.FC<DailyInspectionPanelProps> = ({ session, onComplete }) => {
    const { state } = session;
    const [leftDrum, setLeftDrum] = useState<string>('');
    const [rightDrum, setRightDrum] = useState<string>('');
    const [hours, setHours] = useState<string>('');
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRetrieveData = async () => {
        if (!state.winchId) return;
        setIsFetching(true);
        try {
            const drums = await getWinchDrums(state.winchId);
            if (drums.left_drum !== null && drums.left_drum !== undefined) setLeftDrum(drums.left_drum.toString());
            if (drums.right_drum !== null && drums.right_drum !== undefined) setRightDrum(drums.right_drum.toString());
        } catch (e) {
            console.error("Failed to fetch drums", e);
        }
        
        try {
            const h = await getWinchHours(state.winchId);
            if (h.hours !== null && h.hours !== undefined) setHours(h.hours.toString());
        } catch (e) {
            console.error("Failed to fetch hours", e);
        }
        setIsFetching(false);
    };

    const handleSignDI = async () => {
        if (!state.winchId || !state.squadron || !state.operatorSn) return;
        setIsSubmitting(true);
        try {
            await postDayLogToDb({
                squadron_id: state.squadron,
                winch_id: state.winchId,
                operator_id: state.operatorSn,
                trainee: null,
                type: 'di',
                cable_check: null,
                hours: hours ? parseFloat(hours) : null,
            }, state.winchId);
            onComplete();
        } catch (e) {
            console.error("Failed to sign DI", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: 480
        }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                Winch {state.winchId}
            </Typography>

            <Typography sx={{ color: '#f8fafc', mb: 4, textAlign: 'center' }}>
                This winch has not been used today. A Daily Inspection is required.
            </Typography>

            <Typography sx={{ color: '#f8fafc', mb: 2 }}>
                Enter the current drum totals.
            </Typography>

            <Button
                variant="outlined"
                onClick={handleRetrieveData}
                disabled={isFetching}
                sx={{
                    mb: 4,
                    borderColor: '#3b82f6',
                    color: '#f8fafc',
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 3,
                    '&:hover': {
                        borderColor: '#60a5fa',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    }
                }}
            >
                Retrieve data from cloud
            </Button>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                        Left drum total
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. 12"
                        value={leftDrum}
                        onChange={(e) => setLeftDrum(e.target.value)}
                        type="number"
                        sx={{
                            backgroundColor: '#111927',
                            borderRadius: 2,
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                            }
                        }}
                    />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                        Right drum total
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. 5"
                        value={rightDrum}
                        onChange={(e) => setRightDrum(e.target.value)}
                        type="number"
                        sx={{
                            backgroundColor: '#111927',
                            borderRadius: 2,
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                            }
                        }}
                    />
                </Box>
            </Box>

            <Box sx={{ width: '100%', mb: 4 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                    Hours
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 123.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    type="number"
                    sx={{
                        backgroundColor: '#111927',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                        }
                    }}
                />
            </Box>

            <Button
                variant="contained"
                disabled={isSubmitting}
                onClick={handleSignDI}
                sx={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    py: 1.5,
                    px: 4,
                    fontSize: '16px',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                    '&:hover': {
                        backgroundColor: '#059669',
                        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.23)'
                    }
                }}
            >
                Sign DI
            </Button>
        </Box>
    );
};
