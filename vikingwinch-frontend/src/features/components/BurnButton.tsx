import { Button, type ButtonProps } from '@mui/material';




export interface BurnButtonProps extends ButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label: string;
}


export const BurnButton = ({onClick, isLoading, label, ...rest}: BurnButtonProps) => (
    <Button
        onClick={onClick}
        disabled={isLoading}
        variant="contained"
        fullWidth
        sx={{
            py: 4,
            px: 2,
            fontSize: '20px',
            fontWeight: 700,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            color: 'white',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            flexDirection: 'column',
            gap: 1,
            whiteSpace: 'nowrap',
            '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
            },
        }}
        {...rest}
    >
        {label}

    </Button>
);



export default BurnButton;
