import React, { useState } from 'react';
import { Box, Button, FormControl, Grid, MenuItem, Select, TextField, Typography, Alert, Stack } from '@mui/material';
import { DrumToggleGroup } from './DrumToggleGroup';
import type { DrumPosition } from '../types';
import { darkSelectStyles, darkTextFieldStyles } from '../../themes/styles';
import { useWinchSession } from '../hooks/useWinchSession';

export const RepairsPanel: React.FC = () => {
    const { addRemark, isLoading, error, derived } = useWinchSession();
    const [repair, setRepair] = useState<string>('');
    const [drum, setDrum] = useState<DrumPosition>('left');
    const [driver, setDriver] = useState<string>('Joe Bloggs');
    const [supervisor, setSupervisor] = useState<string>('');

    const hasLaunches = drum === 'left' ? derived.leftLaunches > 0 : derived.rightLaunches > 0;

    const handleSubmit = async () => {
        if (!repair.trim() || !hasLaunches || !supervisor) return;
        try {
            await addRemark(`Repair: ${repair}`, drum);
            setRepair('');
            setSupervisor(''); // Optional: clear supervisor after submit
        } catch (err) {
            // Error state is captured by useWinchSession and rendered below
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#8b9bb4', mb: 1 }}>
                Repair details
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
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
                        <Select value={driver} onChange={(e) => setDriver(e.target.value)} sx={darkSelectStyles}>
                            <MenuItem value="Joe Bloggs">Joe Bloggs</MenuItem>
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
                            <MenuItem value="" disabled>Select supervisor...</MenuItem>
                            <MenuItem value="Admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !repair.trim() || !hasLaunches || !supervisor}
                    variant="contained"
                    sx={{ backgroundColor: '#3b5f99', textTransform: 'none', borderRadius: 2 }}
                >
                    {isLoading ? 'Submitting...' : 'Sign as Supervisor'}
                </Button>
            </Box>
        </Box>
    );
};
