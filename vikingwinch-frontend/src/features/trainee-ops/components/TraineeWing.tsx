import React from "react";
import {Box, ButtonBase, Stack, Typography} from '@mui/material';
import {ActiveDriverToggle} from './ActiveDriverToggle';

import type {OperatorRead} from '../../../core/types';
import {traineeWingSx, traineeWingWidth, wingPanel, wingPanelButton} from "../../../themes/styles.ts";


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
            sx={traineeWingSx}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: {xs: 'auto', md: '100%'},
                    display: 'flex',
                    flexDirection: {xs: 'column', md: 'row'},
                    justifyContent: {xs: 'flex-start', md: 'center'},
                    alignItems: {xs: 'stretch', md: 'center'},
                }}
            >
                <ButtonBase
                    onClick={onToggle}
                    sx={wingPanelButton}
                >
                    <Typography variant='subtitle2' sx={{writingMode: {xs: 'horizontal-tb', md: 'vertical-rl'}}}>
                        Trainee info
                    </Typography>
                </ButtonBase>

                <Box
                    sx={wingPanel(open, traineeWingWidth)}
                >
                    <Box sx={{width: '100%', maxWidth: {xs: '100%', md: traineeWingWidth}, minHeight: 0, p: 3, boxSizing: 'border-box'}}>
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