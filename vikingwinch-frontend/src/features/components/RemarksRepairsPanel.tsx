import React, { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import type {PanelType} from '../types';
import { getTabButtonStyles } from '../../themes/styles';
import { RemarksPanel } from './RemarksPanel';
import { RepairsPanel } from './RepairsPanel';

export const RemarksRepairsPanel: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const handleToggle = (panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <Box sx={{ maxWidth: 600, p: 2, backgroundColor: '#0f172a', borderRadius: 3 }}>

      <Stack direction="row" spacing={1}>
        <Button
          fullWidth
          variant={activePanel === 'remarks' ? 'contained' : 'outlined'}
          onClick={() => handleToggle('remarks')}
          sx={{ ...getTabButtonStyles(activePanel === 'remarks'), alignItems: 'center' }}
        >
          Remarks
        </Button>
        <Button
          fullWidth
          variant={activePanel === 'repairs' ? 'contained' : 'outlined'}
          onClick={() => handleToggle('repairs')}
          sx={getTabButtonStyles(activePanel === 'repairs')}
        >
          Repairs
        </Button>
      </Stack>

      <Box
        sx={{
          mt: 2,
          p: 3,
          backgroundColor: '#1c2536',
          border: '1px solid #2f3a4e',
          borderRadius: 3,
          display: activePanel ? 'block' : 'none',
        }}
      >
        <Box sx={{ display: activePanel === 'remarks' ? 'block' : 'none' }}>
          <RemarksPanel />
        </Box>
        <Box sx={{ display: activePanel === 'repairs' ? 'block' : 'none' }}>
          <RepairsPanel />
        </Box>
      </Box>
    </Box>
  );
};

export default RemarksRepairsPanel
