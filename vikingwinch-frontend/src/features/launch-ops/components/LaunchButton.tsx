import React from 'react';
import {Button, type ButtonProps} from '@mui/material';

type LaunchButtonMode = 'default' | 'burn';

export interface LaunchButtonProps extends ButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label: React.ReactNode;
  mode?: LaunchButtonMode;
}

export const LaunchButton = ({
    onClick,
    isLoading,
    label,
    mode = 'default',
    sx,
    ...rest
}: LaunchButtonProps) => (
    <Button
        onClick={onClick}
        disabled={isLoading}
        variant="contained"
        fullWidth
        sx={{
            // Base styles
            py: 4,
            px: 2,
            fontSize: '20px',
            fontWeight: 700,
            borderRadius: '20px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            flexDirection: 'column',
            gap: 1,
            whiteSpace: 'nowrap',
            textTransform: 'none',
            ...sx,
        }}
        {...rest}
    >
        {label}

    </Button>
);


export default LaunchButton;
