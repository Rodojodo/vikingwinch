import React, {useState} from 'react';
import {Alert, Box, Button, Stack, TextField, Typography} from '@mui/material';
import {darkTextFieldStyles, getTabButtonStyles} from '../../../themes/styles.ts';
import {useSessionIdentity} from '../../../app/hooks/useSessionIdentity.ts';
import {useDayOps} from '../hooks/useDayOps.ts';

type FinishDayPanelProps = {
    isLoading: boolean;
    diHours: number | null;
    onFinished: (hours: number) => void;
};

export const FinishDayPanel: React.FC<FinishDayPanelProps> = ({isLoading, diHours, onFinished}) => {
    const {winchId} = useSessionIdentity();
    const {finishDay} = useDayOps();
    const [isOpen, setIsOpen] = useState(false);
    const [hoursStop, setHoursStop] = useState<string>('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const parsedDiHours = diHours === null ? NaN : Number(diHours);
    const parsedHours = hoursStop.trim() ? Number(hoursStop) : NaN;
    const hasDiHours = Number.isFinite(parsedDiHours);
    const isValidHours = hasDiHours && Number.isFinite(parsedHours) && parsedHours > parsedDiHours;
    const validationError = hoursStop.trim() && (!Number.isFinite(parsedHours) || !hasDiHours || parsedHours <= parsedDiHours)
        ? `Must be greater than DI hours ${hasDiHours ? parsedDiHours : ''}`
        : null;

    const handleSubmit = async () => {
        if (!winchId) return;
        setLocalError(null);
        try {
            await finishDay(parsedHours);
            onFinished(parsedHours);
            setHoursStop('');
            setIsOpen(false);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Failed to submit finish day');
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
                        {validationError && (
                            <Typography variant="caption" color="error">
                                {validationError}
                            </Typography>
                        )}
                    </Box>

                    <Button
                        fullWidth
                        onClick={handleSubmit}
                        disabled={isLoading || !isValidHours}
                        variant="contained"
                        color="primary"
                        sx={{borderRadius: 2, py: 1.5}}
                    >
                        {isLoading ? 'Submitting...' : 'Finish Day'}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
};
