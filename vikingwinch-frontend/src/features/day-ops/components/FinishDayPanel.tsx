import React, {useState} from 'react';
import {Alert, Box, Button, Stack, TextField, Typography} from '@mui/material';
import {darkTextFieldStyles, getTabButtonStyles} from '../../../themes/styles.ts';
import {useSessionIdentity} from '../../../app/hooks/useSessionIdentity.ts';
import {useDayOps} from '../hooks/useDayOps.ts';

type FinishDayPanelProps = {
    isLoading: boolean;
    onExportLog?: () => Promise<void>;
};

export const FinishDayPanel: React.FC<FinishDayPanelProps> = ({isLoading, onExportLog}) => {
    const {winchId} = useSessionIdentity();
    const {finishDay} = useDayOps();
    const [isOpen, setIsOpen] = useState(false);
    const [hoursStop, setHoursStop] = useState<string>('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleSubmit = async () => {
        if (!winchId) return;
        setLocalError(null);
        const hours = hoursStop ? parseFloat(hoursStop) : null;
        try {
            await finishDay(hours);
            setHoursStop('');
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
