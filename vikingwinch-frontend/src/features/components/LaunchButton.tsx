import { Button, type ButtonProps } from '@mui/material';


type LaunchButtonMode = 'default' | 'burn';

export interface LaunchButtonProps extends ButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label: string;
  mode?: LaunchButtonMode;
}

const modeStyles: Record<LaunchButtonMode, any> = {
    default: {
        color: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
        },
    },
    burn: {
        color: '#ff4444', // Adjust specific burn colors as required
        borderColor: 'rgba(255, 68, 68, 0.1)',
        '&:hover': {
            borderColor: 'rgba(255, 68, 68, 0.3)',
            backgroundColor: 'rgba(255, 68, 68, 0.04)',
        },
    },
};

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

            // Mode-specific styles
            ...modeStyles[mode],

            // Allow parent overrides
            ...sx,
        }}
        {...rest}
    >
        {label}

    </Button>
);


export default LaunchButton;
