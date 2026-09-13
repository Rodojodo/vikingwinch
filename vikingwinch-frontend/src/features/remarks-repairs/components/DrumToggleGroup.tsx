import React from 'react';
import {Box, ToggleButton, ToggleButtonGroup} from '@mui/material';
import {getSlidingPillBackgroundSx, slidingPillSx, toggleContainerSx} from '../../../themes/styles';

interface DrumToggleGroupProps {
    value: 'left' | 'right';
    onChange: (value: 'left' | 'right') => void;
}

export const DrumToggleGroup: React.FC<DrumToggleGroupProps> = ({ value, onChange }) => {
    const isRightActive = value === 'right';

    return (
        <Box sx={toggleContainerSx}>
            <Box sx={getSlidingPillBackgroundSx(isRightActive)}/>
            <ToggleButtonGroup
                value={value}
                exclusive
                fullWidth
                onChange={(_, next) => next && onChange(next)}
                sx={
                    slidingPillSx

                }
            >
                <ToggleButton value="left">Left drum</ToggleButton>
                <ToggleButton value="right">Right drum</ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );
};