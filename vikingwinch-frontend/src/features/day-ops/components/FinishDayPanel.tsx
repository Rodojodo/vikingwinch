import React, {useEffect, useState} from 'react';
import {Alert, Box, Button, FormControl, MenuItem, Select, Stack, TextField, Typography} from '@mui/material';
import {darkMenuStyles, darkSelectStyles, darkTextFieldStyles, getTabButtonStyles} from '../../../themes/styles.ts';
import {getOperatorsForSquadron} from '../../../core/http/operatorsClient.ts';
import type {OperatorRead} from '../../../core/types';
import {useSessionIdentity} from '../../../app/hooks/useSessionIdentity.ts';
import {useDayOps} from '../hooks/useDayOps.tsx';

type FinishDayPanelProps = {
    isLoading: boolean;
    onExportLog?: () => Promise<void>;
};

export const FinishDayPanel: React.FC<FinishDayPanelProps> = ({isLoading, onExportLog}) => {
    const {squadronId, winchId} = useSessionIdentity();
    const {finishDay} = useDayOps();
    const [isOpen, setIsOpen] = useState(false);
    const [hoursStop, setHoursStop] = useState<string>('');
    const [cableCheckBy, setCableCheckBy] = useState<string>('');
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isFetchingOperators, setIsFetchingOperators] = useState(false);

    const [prevFetchKey, setPrevFetchKey] = useState({ squadronId, isOpen });
    if (squadronId !== prevFetchKey.squadronId || isOpen !== prevFetchKey.isOpen) {
        setPrevFetchKey({ squadronId, isOpen });
        if (squadronId && isOpen) {
            setIsFetchingOperators(true);
            setLocalError(null);
        }
    }

    useEffect(() => {
        if (!squadronId || !isOpen) return;

        const controller = new AbortController();

        getOperatorsForSquadron(squadronId, controller.signal)
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
    }, [squadronId, isOpen]);

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleSubmit = async () => {
        if (!winchId) return;
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
        if (!onExportLog) return;
        try {
            await onExportLog();
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Failed to download log');
        }
    };

    return (
        <Box sx={{ width: '100%', p: 0 }}>
            <Button
                fullWidth
                onClick={handleToggle}
                sx={getTabButtonStyles(isOpen)}
            >
                Finish Day
            </Button>

            <Box
                sx={{
                    mt: 2,
                    p: 3,
                    backgroundColor: 'transparent',
                    border: 1,
                    borderColor: 'surface.border',
                    borderRadius: 3,
                    display: isOpen ? 'block' : 'none',
                }}
            >
                <Stack spacing={2}>
                    <Typography variant="h3">
                        Finish Day
                    </Typography>

                    {localError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {localError}
                        </Alert>
                    )}

                    <Box>
                        <Typography variant="subtitle2" sx={{color: 'text.secondary', mb: 1, textAlign: 'center'}}>
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
                        <Typography variant="subtitle2" sx={{color: 'text.secondary', mb: 1, textAlign: 'center'}}>
                            Cable Check By
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                displayEmpty
                                value={cableCheckBy}
                                onChange={(e) => setCableCheckBy(e.target.value)}
                                sx={darkSelectStyles}
                                MenuProps={darkMenuStyles}
                                disabled={isFetchingOperators}
                            >
                                <MenuItem value="">
                                    {isFetchingOperators ? 'Loading...' : 'Select...'}
                                </MenuItem>
                                {operators.map(op => (
                                    <MenuItem key={op.service_no} value={op.service_no}>
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
                            color="primary"
                            sx={{borderRadius: 2, py: 1.5}}
                        >
                            {isLoading ? 'Submitting...' : 'Finish Day'}
                        </Button>
                        <Button
                            fullWidth
                            onClick={handleDownloadLog}
                            variant="contained"
                            color="primary"
                            sx={{borderRadius: 2, py: 1.5}}
                        >
                            Download Log
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
};
