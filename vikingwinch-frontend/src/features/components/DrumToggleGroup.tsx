import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { DrumPosition } from '../types';

interface DrumToggleGroupProps {
    value: DrumPosition;
    onChange: (val: DrumPosition) => void;
}

export const DrumToggleGroup: React.FC<DrumToggleGroupProps> = ({ value, onChange }) => {
    return (
        <Stack
            direction="row"
            spacing={2}
            sx={{ mb: 2, alignItems: 'center' }}
        >
            <Box sx={{ backgroundColor: '#111927', borderRadius: 2, display: 'flex', p: 0.5 }}>
                <Button
                    disableElevation
                    variant={value === 'left' ? 'contained' : 'text'}
                    onClick={() => onChange('left')}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 1.5,
                        backgroundColor: value === 'left' ? '#2970ff' : 'transparent',
                        color: value === 'left' ? 'white' : '#8b9bb4',
                        minWidth: '80px',
                    }}
                >
                    Left drum
                </Button>
                <Button
                    disableElevation
                    variant={value === 'right' ? 'contained' : 'text'}
                    onClick={() => onChange('right')}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 1.5,
                        backgroundColor: value === 'right' ? '#2970ff' : 'transparent',
                        color: value === 'right' ? 'white' : '#8b9bb4',
                        minWidth: '80px',
                    }}
                >
                    Right drum
                </Button>
            </Box>
            <Typography variant="body2" sx={{ color: '#8b9bb4' }}>
                No launches yet
            </Typography>
        </Stack>
    );
};