import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, Grid, MenuItem, Select, TextField, Typography, Alert, Stack } from '@mui/material';
import { DrumToggleGroup } from './DrumToggleGroup';
import type { DrumPosition, OperatorRead } from '../types';
import { darkSelectStyles, darkTextFieldStyles } from '../../themes/styles';
import { useWinchSession } from '../hooks/useWinchSession';
import { getOperatorsForSquadron } from '../api/dataClient';

export const RepairsPanel: React.FC = () => {
    const { addRemark, isLoading, error, derived, state } = useWinchSession();
    const [repair, setRepair] = useState<string>('');
    const [drum, setDrum] = useState<DrumPosition>('left');
    
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [driver, setDriver] = useState<string>('');
    const [supervisor, setSupervisor] = useState<string>('none');
    const [fetchError, setFetchError] = useState<string | null>(null);

    const hasLaunches = drum === 'left' ? derived.leftLaunches > 0 : derived.rightLaunches > 0;

    useEffect(() => {
        if (state.squadron) {
            getOperatorsForSquadron(state.squadron)
                .then(setOperators)
                .catch(() => setFetchError('Failed to load operators'));
        }
    }, [state.squadron]);

    const handleSubmit = async () => {
        if (!repair.trim() || !hasLaunches || !driver) return;
        
        let remarkText = `Repair: ${repair} | Worker: ${driver}`;
        if (supervisor !== 'none') {
            remarkText += ` | Sup: ${supervisor}`;
        }
        
        try {
            await addRemark(remarkText, drum);
            setRepair('');
            setDriver('');
            setSupervisor('none');
        } catch (err) {
            // Error state is captured by useWinchSession and rendered below
        }
    };

    const isSubmitDisabled = isLoading || !repair.trim() || !hasLaunches || !driver || (driver === supervisor && supervisor !== 'none');

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#8b9bb4', mb: 1 }}>
                Repair details
            </Typography>
            {(error || fetchError) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error || fetchError}
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
                    <Typography variant="subtitle2" sx={{ color: '#8b9bb4', mb: 1 }}>Work c/o by (driver)</Typography>
                    <FormControl fullWidth size="small">
                        <Select 
                            displayEmpty
                            value={driver} 
                            onChange={(e) => setDriver(e.target.value)} 
                            sx={darkSelectStyles}
                        >
                            <MenuItem value="" disabled>Select worker...</MenuItem>
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
                        >
                            <MenuItem value="none">No supervisor</MenuItem>
                            {operators.map(op => (
                                <MenuItem 
                                    key={op.sn} 
                                    value={op.sn} 
                                    disabled={op.sn === driver && driver !== ''}
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
