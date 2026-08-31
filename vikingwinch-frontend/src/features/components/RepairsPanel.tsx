import React, { useState } from 'react';
import { Box, Button, FormControl, Grid, MenuItem, Select, TextField, Typography } from '@mui/material';
import { DrumToggleGroup } from './DrumToggleGroup';
import type {DrumPosition} from '../types';
import { darkSelectStyles, darkTextFieldStyles } from '../../themes/styles';

export const RepairsPanel: React.FC = () => {
    const [repair, setRepair] = useState<string>('');
    const [drum, setDrum] = useState<DrumPosition>('left');
    const [driver, setDriver] = useState<string>('Joe Bloggs');
    const [supervisor, setSupervisor] = useState<string>('');

    return (
        <Box sx={{mt: 2}}>
            <Typography variant="subtitle2" sx={{color: '#8b9bb4', mb: 1}}>
                Repair details
            </Typography>
            <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the repair carried out..."
                value={repair}
                onChange={(e) => setRepair(e.target.value)}
                sx={darkTextFieldStyles}
            />

            <Box sx={{mt: 2, mb: 2}}>
                <DrumToggleGroup value={drum} onChange={setDrum}/>
            </Box>

            <Grid container spacing={2}>
                <Grid size={6}>
                    <Typography variant="subtitle2" sx={{color: '#8b9bb4', mb: 1}}>Work c/o by (driver)</Typography>
                    <FormControl fullWidth size="small">
                        <Select value={driver} onChange={(e) => setDriver(e.target.value)} sx={darkSelectStyles}>
                            <MenuItem value="Joe Bloggs">Joe Bloggs</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={6}>
                    <Typography variant="subtitle2" sx={{color: '#8b9bb4', mb: 1}}>Supervised by</Typography>
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

            <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: 3}}>
                <Button
                    variant="contained"
                    sx={{backgroundColor: '#3b5f99', textTransform: 'none', borderRadius: 2}}
                >
                    Sign as Supervisor
                </Button>
            </Box>
        </Box>
    );
};
