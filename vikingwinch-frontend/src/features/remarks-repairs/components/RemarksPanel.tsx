import type {DrumPosition} from '../../../core/types/common';
import React, {useState} from 'react';
import {Alert, Box, Button, TextField, Typography} from '@mui/material';
import {DrumToggleGroup} from './DrumToggleGroup';
import type {DerivedWinchState} from '../../winch-ops/types';
import {darkTextFieldStyles} from "../../../themes/styles.ts";


type RemarksPanelProps = {
  addRemark: (remark: string | null, drum: DrumPosition) => Promise<void>;
  isLoading: boolean;
  derived: DerivedWinchState;
};

export const RemarksPanel: React.FC<RemarksPanelProps> = ({ addRemark, isLoading, derived }) => {
    const [remark, setRemark] = useState<string>('');
    const [drum, setDrum] = useState<DrumPosition>('left');

    const targetRecord = drum === 'left' ? derived.leftLastRecord : derived.rightLastRecord;
    const hasLaunches = !!targetRecord;

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
            <Typography variant="subtitle2" sx={{mb: 1}}>
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
            <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mt: 2}}>
                <Box sx={{flex: 1}}>
                    <DrumToggleGroup value={drum} onChange={setDrum} />
                </Box>

                {!hasLaunches && (
                    <Typography variant="subtitle2">
                        No launches yet
                    </Typography>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !remark.trim() || !hasLaunches}
                    variant="contained"
                    color="primary"
                    sx={{textTransform: 'none', borderRadius: 2}}
                >
                    {isLoading ? 'Submitting...' : 'Submit Remark'}
                </Button>
            </Box>
        </Box>
    );
};