import {Box, ButtonBase, Stack, Typography} from '@mui/material';
import {ActiveDriverToggle} from './ActiveDriverToggle';
import {TraineeAssignmentPanel} from '../../day-ops/components/TraineeAssignmentPanel.tsx';
import type {DayLogResponse, OperatorRead} from '../../winch-ops/types';
import {wingPanel, wingPanelButton} from "../../../themes/styles.ts";


interface TraineeWingProps {
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
    recordSignOn: (traineeSn: string | null) => Promise<DayLogResponse>;
}

const WING_WIDTH = 320;

export const TraineeWing: React.FC<TraineeWingProps> = ({
                                                            open,
                                                            onToggle,
                                                            isLoading,
                                                            squadron,
                                                            operatorSn,
                                                            operatorName,
                                                            traineeSn,
                                                            traineeName,
                                                            ActiveDriverSn,
                                                            setActiveDriver,
                                                            recordSignOn,
                                                        }) => {
    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <Box sx={{position: 'relative'}}>
                <ButtonBase
                    onClick={onToggle}
                    sx={wingPanelButton}
                >
                    <Typography sx={{
                        writingMode: 'vertical-rl',
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                    }}>
                        Trainee info
                    </Typography>
                </ButtonBase>

                <Box
                    sx={wingPanel(open, WING_WIDTH)}
                >
                    <Box sx={{width: WING_WIDTH, p: 3, boxSizing: 'border-box'}}>
                        <Stack spacing={3}>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontSize: '32px',
                                    fontWeight: 700,
                                    letterSpacing: '-0.5px',
                                    mb: 1,
                                    fontFamily: '"Outfit", sans-serif',
                                    textAlign: 'center'
                                }}
                            >
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
                            <TraineeAssignmentPanel
                                isLoading={isLoading}
                                recordSignOn={recordSignOn}
                                squadron={squadron}
                                operatorSn={operatorSn}
                                traineeSn={traineeSn}
                            />
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};