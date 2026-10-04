import React from "react";
import {Box, ButtonBase, Stack, Typography} from '@mui/material';
import {ActiveDriverToggle} from './ActiveDriverToggle';

import type {OperatorRead} from '../../../core/types';
import {wingPanel, wingPanelButton} from "../../../themes/styles.ts";


interface TraineeWingProps {
    children?: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    isLoading: boolean;
    squadron?: string;
    operatorSn: string;
    operatorName: string;
    traineeSn: string | null;
    traineeName?: string;
    ActiveDriverSn: string;
    operators: OperatorRead[];
    isFetchingOperators: boolean;
    setActiveDriver: (sn: string) => void;
}

const WING_WIDTH = 320;

export const TraineeWing: React.FC<TraineeWingProps> = ({
                                                            open,
                                                            onToggle,
                                                            operatorSn,
                                                            operatorName,
                                                            traineeSn,
                                                            traineeName,
                                                            ActiveDriverSn,
                                                            setActiveDriver,
children,
                                                        }) => {
    return (
        <Box
            sx={{
                position: {xs: 'relative', sm: 'absolute'},
                top: {xs: 'auto', sm: 0},
                left: {xs: 'auto', sm: '100%'},
                width: '100%',
                maxWidth: {xs: '100%', sm: WING_WIDTH},
                height: {xs: 'auto', sm: '100%'},
                display: 'flex',
                alignItems: {xs: 'stretch', sm: 'center'},
                mt: {xs: 2, sm: 0},
            }}
        >
            <Box sx={{position: 'relative', width: '100%'}}>
                <ButtonBase
                    onClick={onToggle}
                    sx={wingPanelButton}
                >
                    <Typography variant='subtitle2' sx={{writingMode: {xs: 'horizontal-tb', sm: 'vertical-rl'}}}>
                        Trainee info
                    </Typography>
                </ButtonBase>

                <Box
                    sx={wingPanel(open, WING_WIDTH)}
                >
                    <Box sx={{width: '100%', maxWidth: {xs: '100%', sm: WING_WIDTH}, p: 3, boxSizing: 'border-box'}}>
                        <Stack spacing={3}>
                            <Typography variant="h3">
                                Trainee Info
                            </Typography>
                            <ActiveDriverToggle
                                operatorSn={operatorSn}
                                operatorName={operatorName}
                                traineeSn={traineeSn}
                                traineeName={traineeName}
                                value={ActiveDriverSn}
                                onChange={setActiveDriver}
                            />
                            {children}
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};