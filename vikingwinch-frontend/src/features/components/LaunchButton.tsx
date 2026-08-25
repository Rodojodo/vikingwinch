import React from 'react';
import { Button, type ButtonProps, CircularProgress } from '@mui/material';

// 1. Extend MUI's ButtonProps to inherit default attributes
export interface LaunchButtonProps extends ButtonProps {
  /** Toggles a loading spinner and disables the button */
  isLoading?: boolean;
}

export const LaunchButton: React.FC<LaunchButtonProps> = ({
  isLoading = false,
  children,
  disabled,
  ...rest
}) => {
  return (
    <Button
        variant="contained"
        fullwidth
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
    >
      Left Button

    </Button>
  );
};

export default LaunchButton;

//  width: 100%;
//   padding: 32px 16px;
//   font-size: 20px;
//   font-weight: 700;
//   border: 1px solid rgba(255, 255, 255, 0.1);
//   border-radius: 20px;
//   cursor: pointer;
//   color: white;
//   transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: 8px;
//   white-space: nowrap;
// }