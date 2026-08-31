import React, { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import type {PanelType} from '../types';
import { RemarksPanel } from './RemarksPanel';
import { RepairsPanel } from './RepairsPanel';

type RemarksRepairsPanelProps = {
  addRemark: (remark: string | null, drum: any) => Promise<void>;
  isLoading: boolean;
  derived: any;
  state: any;
};

export const RemarksRepairsPanel: React.FC<RemarksRepairsPanelProps> = ({ addRemark, isLoading, derived, state }) => {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const handleToggle = (panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <Box sx={{ width: '100%', p: 0 }}>

      <Stack direction="row" spacing={1}>
        <Button
          fullWidth
          onClick={() => handleToggle('remarks')}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '16px',
            backgroundColor: activePanel === 'remarks' ? '#3b82f6' : 'rgba(255, 255, 255, 0.03)',
            color: activePanel === 'remarks' ? 'white' : '#94a3b8',
            border: `1px solid ${activePanel === 'remarks' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '12px',
            boxShadow: activePanel === 'remarks' ? '0 2px 8px rgba(59, 130, 246, 0.5)' : 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: activePanel === 'remarks' ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
              color: 'white',
              borderColor: activePanel === 'remarks' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Remarks
        </Button>
        <Button
          fullWidth
          onClick={() => handleToggle('repairs')}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '16px',
            backgroundColor: activePanel === 'repairs' ? '#3b82f6' : 'rgba(255, 255, 255, 0.03)',
            color: activePanel === 'repairs' ? 'white' : '#94a3b8',
            border: `1px solid ${activePanel === 'repairs' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '12px',
            boxShadow: activePanel === 'repairs' ? '0 2px 8px rgba(59, 130, 246, 0.5)' : 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: activePanel === 'repairs' ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
              color: 'white',
              borderColor: activePanel === 'repairs' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Repairs
        </Button>
      </Stack>

      <Box
        sx={{
          mt: 2,
          p: 3,
          backgroundColor: 'transparent',
          border: '1px solid #363e51',
          borderRadius: 3,
          display: activePanel ? 'block' : 'none',
        }}
      >
        <Box sx={{ display: activePanel === 'remarks' ? 'block' : 'none' }}>
          <RemarksPanel addRemark={addRemark} isLoading={isLoading} derived={derived} />
        </Box>
        <Box sx={{ display: activePanel === 'repairs' ? 'block' : 'none' }}>
          <RepairsPanel addRemark={addRemark} isLoading={isLoading} derived={derived} state={state} />
        </Box>
      </Box>
    </Box>
  );
};

export default RemarksRepairsPanel
