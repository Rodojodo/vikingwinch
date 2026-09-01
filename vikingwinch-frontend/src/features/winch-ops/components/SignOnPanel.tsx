import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, FormControl, Select, MenuItem, Paper } from '@mui/material';
import { getOperatorsForSquadron } from '../api/dataClient.ts';
import type { OperatorRead } from '../types';
import { useWinchSession } from '../hooks/useWinchSession.ts';

interface SignOnPanelProps {
    session: ReturnType<typeof useWinchSession>;
    onComplete: () => void;
    alreadyInspected: boolean;
}

export const SignOnPanel: React.FC<SignOnPanelProps> = ({ session, onComplete, alreadyInspected }) => {
    const { state, changeTrainee, isLoading } = session;
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [selectedTraineeSn, setSelectedTraineeSn] = useState<string>('');
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!state.squadron) return;
        setIsFetching(true);
        const controller = new AbortController();
        getOperatorsForSquadron(state.squadron, controller.signal)
            .then(data => {
                if (!controller.signal.aborted) {
                    setOperators(data);
                }
            })
            .catch(console.error)
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsFetching(false);
                }
            });
        return () => controller.abort();
    }, [state.squadron]);

    const handleSignOn = async () => {
        try {
            await changeTrainee(selectedTraineeSn || null as any);
            onComplete();
        } catch (e) {
            console.error("Sign on failed", e);
        }
    };

    const currentOperatorObj = operators.find(o => o.service_no === state.operatorSn);
    const traineeObj = operators.find(o => o.service_no === selectedTraineeSn);
    
    let currentOperatorText = currentOperatorObj ? currentOperatorObj.name : state.operatorSn;
    if (traineeObj) {
        currentOperatorText += ` & ${traineeObj.name}`;
    }

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
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                Winch {state.winchId}
            </Typography>

            <Typography sx={{ color: '#94a3b8', fontSize: '16px', mb: 2 }}>
                Current operator: {currentOperatorText}
            </Typography>

            {alreadyInspected && (
                <Typography sx={{ color: '#f8fafc', mb: 4 }}>
                    This winch has already been inspected today.
                </Typography>
            )}

            <Paper elevation={0} sx={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                p: 2,
                mb: 3
            }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                    Add trainee (optional)
                </Typography>
                <FormControl fullWidth size="small">
                    <Select
                        value={selectedTraineeSn}
                        onChange={(e) => setSelectedTraineeSn(e.target.value)}
                        displayEmpty
                        disabled={isFetching}
                        sx={{
                            backgroundColor: '#111927',
                            color: 'white',
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                            '& .MuiSvgIcon-root': { color: '#94a3b8' }
                        }}
                    >
                        <MenuItem value="">— None —</MenuItem>
                        {operators.filter(op => op.service_no !== state.operatorSn).map(op => (
                            <MenuItem key={op.service_no} value={op.service_no}>
                                {op.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            <Button
                variant="contained"
                fullWidth
                disabled={isLoading}
                onClick={handleSignOn}
                sx={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    py: 1.5,
                    fontSize: '16px',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                    '&:hover': {
                        backgroundColor: '#2563eb',
                        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.23)'
                    }
                }}
            >
                Walkaround complete. Sign on to winch
            </Button>
        </Box>
    );
};
