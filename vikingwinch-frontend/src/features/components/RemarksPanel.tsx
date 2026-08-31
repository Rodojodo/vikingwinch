import React, {useState} from 'react';
import {Box, Button, TextField, Typography, Alert} from '@mui/material';
import {DrumToggleGroup} from './DrumToggleGroup';
import type {DrumPosition} from '../types';
import {darkTextFieldStyles} from '../../themes/styles';
import {useWinchSession} from '../hooks/useWinchSession';

export const RemarksPanel: React.FC = () => {
    const { addRemark, isLoading, error } = useWinchSession();
    const [remark, setRemark] = useState<string>('');
    const [drum, setDrum] = useState<DrumPosition>('left');

    const handleSubmit = async () => {
        if (!remark.trim()) return;
        try {
            await addRemark(remark, drum);
            setRemark('');
        } catch (err) {
            // Error state is captured by useWinchSession and rendered below
        }
    };

    return (
        <Box sx={{mt: 2}}>
            <Typography variant="subtitle2" sx={{color: '#8b9bb4', mb: 1}}>
                Launch remarks
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
                placeholder="Enter launch remarks..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                sx={darkTextFieldStyles}
            />
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 2}}>
                <DrumToggleGroup value={drum} onChange={setDrum}/>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !remark.trim()}
                    variant="contained"
                    sx={{backgroundColor: '#3b5f99', textTransform: 'none', borderRadius: 2}}
                >
                    {isLoading ? 'Submitting...' : 'Submit Remark'}
                </Button>
            </Box>
        </Box>
    );
};