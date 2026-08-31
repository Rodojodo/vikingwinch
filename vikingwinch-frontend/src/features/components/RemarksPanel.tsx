import React, {useState} from 'react';
import {Box, Button, TextField, Typography} from '@mui/material';
import {DrumToggleGroup} from './DrumToggleGroup';
import type {DrumPosition} from '../types';
import {darkTextFieldStyles} from '../../themes/styles';

export const RemarksPanel: React.FC = () => {
    const [remark, setRemark] = useState<string>('');
    const [drum, setDrum] = useState<DrumPosition>('left');

    return (
        <Box sx={{mt: 2}}>
            <Typography variant="subtitle2" sx={{color: '#8b9bb4', mb: 1}}>
                Launch remarks
            </Typography>
            <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Enter launch remarks..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                sx={darkTextFieldStyles}
            />
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 2}}>
                <DrumToggleGroup value={drum} onChange={setDrum}/>
                <Button
                    variant="contained"
                    sx={{backgroundColor: '#3b5f99', textTransform: 'none', borderRadius: 2}}
                >
                    Submit Remark
                </Button>
            </Box>
        </Box>
    );
};
