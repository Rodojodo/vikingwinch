import React, {useState} from 'react';
import {Box, Button, Stack} from '@mui/material';
// eslint-disable-next-line no-restricted-imports
import type {DerivedWinchState} from '../../launch-ops/types';
import type {DrumPosition} from '../../../core/types';
import type {PanelType} from '../types';
import {RemarksPanel} from './RemarksPanel.tsx';
import {RepairsPanel} from './RepairsPanel.tsx';
import {elevatedPanel, getTabButtonStyles} from '../../../themes/styles.ts';
import type {SxProps, Theme} from "@mui/material/styles";

type RemarksRepairsPanelProps = {
    addRemark: (remark: string | null, drum: DrumPosition) => Promise<void>;
    isLoading: boolean;
    derived: DerivedWinchState;
    squadronId: string;
};

export const RemarksRepairsPanel: React.FC<RemarksRepairsPanelProps> = ({ addRemark, isLoading, derived, squadronId }) => {
    const [activePanel, setActivePanel] = useState<PanelType>(null);

    const handleToggle = (panel: PanelType) => {
        setActivePanel((prev) => (prev === panel ? null : panel));
    };

    return (
        <Box sx={{width: '100%', p: 0}}>

            <Stack direction="row" spacing={1}>
                <Button
                    fullWidth
                    onClick={() => handleToggle('remarks')}
                    sx={getTabButtonStyles(activePanel === 'remarks')}
                >
                    Remarks
                </Button>
                <Button
                    fullWidth
                    onClick={() => handleToggle('repairs')}
                    sx={getTabButtonStyles(activePanel === 'repairs')}
                >
                    Repairs
                </Button>
            </Stack>

            <Box
                sx={[
                    elevatedPanel,
                    {
                        display: activePanel ? 'block' : 'none',
                    }
                ] as SxProps<Theme>}
            >
                <Box sx={{display: activePanel === 'remarks' ? 'block' : 'none'}}>
                    <RemarksPanel addRemark={addRemark} isLoading={isLoading} derived={derived}/>
                </Box>
                <Box sx={{display: activePanel === 'repairs' ? 'block' : 'none'}}>
                    <RepairsPanel addRemark={addRemark} isLoading={isLoading} derived={derived} squadronId={squadronId}/>
                </Box>
            </Box>
        </Box>
    );
};

export default RemarksRepairsPanel