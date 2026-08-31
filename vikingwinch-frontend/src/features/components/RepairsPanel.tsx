import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, Grid, MenuItem, Select, TextField, Typography, Alert, Stack, CircularProgress } from '@mui/material';
import { DrumToggleGroup } from './DrumToggleGroup';
import type { DrumPosition, OperatorRead } from '../types';
import { darkSelectStyles, darkTextFieldStyles } from '../../themes/styles';
import { useWinchSession } from '../hooks/useWinchSession';
import { getOperatorsForSquadron } from '../api/dataClient';

export const RepairsPanel: React.FC = () => {
    const { addRemark, isLoading, derived, state } = useWinchSession();
    const [repair, setRepair] = useState<string>('');
    const [drum, setDrum] = useState<DrumPosition>('left');
    
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [worker, setWorker] = useState<string>('');
    const [supervisor, setSupervisor] = useState<string>('none');
    
    const [localError, setLocalError] = useState<string | null>(null);
    const [isFetchingOperators, setIsFetchingOperators] = useState(false);

    const hasLaunches = drum === 'left' ? derived.leftLaunches > 0 : derived.rightLaunches > 0;

    useEffect(() => {
        if (!state.squadron) return;

        const controller = new AbortController();
        setIsFetchingOperators(true);
        setLocalError(null);

        getOperatorsForSquadron(state.squadron)
            .then((data) => {
                if (!controller.signal.aborted) {
                    setOperators(data);
                }
            })
            .catch((err) => {
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
    }, [state.squadron]);

    const handleSubmit = async () => {
        if (!repair.trim() || !hasLaunches || !worker) return;
        
        let remarkText = `Repair: ${repair} | Worker: ${worker}`;
        if (supervisor !== 'none') {
            remarkText += ` | Sup: ${supervisor}`;
        }
        
        setLocalError(null);
        try {
            await addRemark(remarkText, drum);
            setRepair('');
            setWorker('');
            setSupervisor('none');
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Failed to submit repair');
        }
    };

    const isSubmitDisabled = isLoading || !repair.trim() || !hasLaunches || !worker || (worker === supervisor && supervisor !== 'none');

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#8b9bb4', mb: 1 }}>
                Repair details
            </Typography>
            {localError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {localError}
                </Alert>
            )}
            <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the repair carried out..."
                value={repair}
                onChange={(e) => setRepair(e.target.value)}
                sx={darkTextFieldStyles}
            />

            <Box sx={{ mt: 2, mb: 2 }}>
                <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                    <DrumToggleGroup value={drum} onChange={setDrum} />
                    {!hasLaunches && (
                        <Typography variant="body2" sx={{ color: '#8b9bb4' }}>
                            No launches yet
                        </Typography>
                    )}
                </Stack>
            </Box>

            <Grid container spacing={2}>
                <Grid size={6}>
                    <Typography variant="subtitle2" sx={{ color: '#8b9bb4', mb: 1 }}>Work c/o by (worker)</Typography>
                    <FormControl fullWidth size="small">
                        <Select 
                            displayEmpty
                            value={worker} 
                            onChange={(e) => setWorker(e.target.value)} 
                            sx={darkSelectStyles}
                            disabled={isFetchingOperators}
                        >
                            <MenuItem value="" disabled>
                                {isFetchingOperators ? 'Loading...' : 'Select worker...'}
                            </MenuItem>
                            {operators.map(op => (
                                <MenuItem 
                                    key={op.sn} 
                                    value={op.sn} 
                                    disabled={supervisor !== 'none' && op.sn === supervisor}
                                >
                                    {op.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={6}>
                    <Typography variant="subtitle2" sx={{ color: '#8b9bb4', mb: 1 }}>Supervised by</Typography>
                    <FormControl fullWidth size="small">
                        <Select
                            displayEmpty
                            value={supervisor}
                            onChange={(e) => setSupervisor(e.target.value)}
                            sx={darkSelectStyles}
                            disabled={isFetchingOperators}
                        >
                            <MenuItem value="none">
                                {isFetchingOperators ? 'Loading...' : 'No supervisor'}
                            </MenuItem>
                            {operators.map(op => (
                                <MenuItem 
                                    key={op.sn} 
                                    value={op.sn} 
                                    disabled={op.sn === worker && worker !== ''}
                                >
                                    {op.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    variant="contained"
                    sx={{ backgroundColor: '#3b5f99', textTransform: 'none', borderRadius: 2 }}
                >
                    {isLoading ? 'Submitting...' : 'Sign as Supervisor'}
                </Button>
            </Box>
        </Box>
    );
};
