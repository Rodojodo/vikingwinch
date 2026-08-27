import React from 'react';
import { Button, type ButtonProps } from '@mui/material';

interface LaunchPayload {
  squadron_id: string;
  winch_id: number;
  operator_id: string;
  drum: string;
}


export interface LaunchButtonProps extends ButtonProps {
  isLeft: boolean;
}

async function launch(isLeft: boolean): Promise<any> {
    const data: LaunchPayload = {
        squadron_id: "123 VGS",
        winch_id: 1,
        operator_id: "OFF-1001",
        drum: isLeft ? "left" : "right"
    };
    const response = await fetch('http://127.0.0.1:8000/launches', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
}

export const LaunchButton: React.FC<LaunchButtonProps> = ({
    state,
    isLeft,
    }) => {
    return (
        <Button
            onClick={() => {
                launch(isLeft);
            }}
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
        >
          { isLeft ? 'Left' : 'Right' } Drum

        </Button>
  );
};

export default LaunchButton;
