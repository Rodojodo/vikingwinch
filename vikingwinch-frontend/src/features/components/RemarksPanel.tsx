import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Stack } from '@mui/material';
import { DrumToggleGroup } from './DrumToggleGroup';
import type { DrumPosition, DerivedWinchState } from '../types';
import {darkTextFieldStyles} from "../../themes/styles.ts";


type RemarksPanelProps = {
  addRemark: (remark: string | null, drum: DrumPosition) => Promise<void>;
  isLoading: boolean;
  derived: DerivedWinchState;
};

export const RemarksPanel: React.FC<RemarksPanelProps> = ({ addRemark, isLoading, derived }) => {
    const [remark, setRemark] = useState<string>('');
    const [drum, setDrum] = useState<DrumPosition>('left');

    const hasLaunches = drum === 'left' ? derived.leftLaunches > 0 : derived.rightLaunches > 0;

    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!remark.trim() || !hasLaunches) return;
        
        if (remark.toLowerCase().startsWith('repair')) {
            setLocalError('Repairs should be logged in the Repairs tab');
            return;
        }
        
        setLocalError(null);
        try {
            await addRemark(remark, drum);
            setRemark('');
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Failed to submit remark');
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#8b9bb4', mb: 1 }}>
                Launch remarks
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
                placeholder="Enter launch remarks..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                sx={darkTextFieldStyles}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 2 }}>
                <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                    <DrumToggleGroup value={drum} onChange={setDrum} />
                    {!hasLaunches && (
                        <Typography variant="body2" sx={{ color: '#8b9bb4' }}>
                            No launches yet
                        </Typography>
                    )}
                </Stack>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !remark.trim() || !hasLaunches}
                    variant="contained"
                    sx={{ backgroundColor: '#3b5f99', textTransform: 'none', borderRadius: 2 }}
                >
                    {isLoading ? 'Submitting...' : 'Submit Remark'}
                </Button>
            </Box>
        </Box>
    );
};