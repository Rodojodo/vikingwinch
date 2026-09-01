import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, MenuItem, Select, TextField, Typography, Alert, Stack } from '@mui/material';
import { darkSelectStyles, darkTextFieldStyles } from '../../themes/styles';
import { getOperatorsForSquadron } from '../api/dataClient';
import type { OperatorRead, WinchLogState } from '../types';
import { exportLog } from '../utils/exportLog';

type FinishDayPanelProps = {
    finishDay: (cableCheck: string | null, hours: number | null) => Promise<any>;
    isLoading: boolean;
    state: WinchLogState;
};

const getTabStyle = (isActive: boolean) => ({
    py: 1.5,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '16px',
    backgroundColor: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.03)',
    color: isActive ? 'white' : '#94a3b8',
    border: `1px solid ${isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: '12px',
    boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.5)' : 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
        color: 'white',
        borderColor: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'
    }
});

export const FinishDayPanel: React.FC<FinishDayPanelProps> = ({ finishDay, isLoading, state }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoursStop, setHoursStop] = useState<string>('');
    const [cableCheckBy, setCableCheckBy] = useState<string>('');
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isFetchingOperators, setIsFetchingOperators] = useState(false);

    useEffect(() => {
        if (!state.squadron || !isOpen) return;

        const controller = new AbortController();
        setIsFetchingOperators(true);
        setLocalError(null);

        getOperatorsForSquadron(state.squadron, controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) {
                    setOperators(data);
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setLocalError('Failed to load operators');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsFetchingOperators(false);
                }
            });

        return () => controller.abort();
    }, [state.squadron, isOpen]);

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleSubmit = async () => {
        setLocalError(null);
        
        const hours = hoursStop ? parseFloat(hoursStop) : null;

        try {
            await finishDay(cableCheckBy || null, hours);
            setHoursStop('');
            setCableCheckBy('');
            setIsOpen(false);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Failed to submit finish day');
        }
    };

    const handleDownloadLog = async () => {
        const parsedHours = hoursStop ? parseFloat(hoursStop) : null;
        const validHours = typeof parsedHours === 'number' && !isNaN(parsedHours) ? parsedHours : null;
        try {
            await exportLog(state, validHours);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Failed to download log');
        }
    };

    return (
        <Box sx={{ width: '100%', p: 0 }}>
            <Button
                fullWidth
                onClick={handleToggle}
                sx={getTabStyle(isOpen)}
            >
                Finish Day
            </Button>

            <Box
                sx={{
                    mt: 2,
                    p: 3,
                    backgroundColor: 'transparent',
                    border: '1px solid #363e51',
                    borderRadius: 3,
                    display: isOpen ? 'block' : 'none',
                }}
            >
                <Stack spacing={2}>
                    <Typography variant="h6" sx={{ color: 'white', textAlign: 'center', fontWeight: 600 }}>
                        Finish Day
                    </Typography>

                    {localError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {localError}
                        </Alert>
                    )}

                    <Box>
                        <Typography variant="subtitle2" sx={{ color: '#8b9bb4', mb: 1, textAlign: 'center' }}>
                            Hours Stop
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            placeholder="e.g. 126.2"
                            value={hoursStop}
                            onChange={(e) => setHoursStop(e.target.value)}
                            sx={darkTextFieldStyles}
                            slotProps={{ htmlInput: { step: '0.1' } }}
                        />
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ color: '#8b9bb4', mb: 1, textAlign: 'center' }}>
                            Cable Check By
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                displayEmpty
                                value={cableCheckBy}
                                onChange={(e) => setCableCheckBy(e.target.value)}
                                sx={darkSelectStyles}
                                disabled={isFetchingOperators}
                            >
                                <MenuItem value="">
                                    {isFetchingOperators ? 'Loading...' : 'Select...'}
                                </MenuItem>
                                {operators.map(op => (
                                    <MenuItem key={op.sn} value={op.sn}>
                                        {op.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        <Button
                            fullWidth
                            onClick={handleSubmit}
                            disabled={isLoading}
                            variant="contained"
                            sx={{ backgroundColor: '#3b5f99', textTransform: 'none', borderRadius: 2, py: 1.5 }}
                        >
                            {isLoading ? 'Submitting...' : 'Finish Day'}
                        </Button>
                        <Button
                            fullWidth
                            onClick={handleDownloadLog}
                            variant="contained"
                            sx={{ backgroundColor: '#3b5f99', textTransform: 'none', borderRadius: 2, py: 1.5 }}
                        >
                            Download Log
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
};
