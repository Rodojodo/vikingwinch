import {Box, ButtonBase, Stack, Typography} from '@mui/material';
import {ActiveDriverToggle} from './ActiveDriverToggle';
import {TraineeAssignmentPanel} from '../../day-ops/components/TraineeAssignmentPanel.tsx';
import type {DayLogResponse, OperatorRead} from '../../winch-ops/types';


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

const HANDLE_WIDTH = 20;
const HANDLE_HEIGHT = 140;
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
                                                            operators,
                                                            isFetchingOperators,
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
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translate(0, -50%)',
                        width: HANDLE_WIDTH,
                        height: HANDLE_HEIGHT,
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderLeft: 'none',
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderTopRightRadius: '10px',
                        borderBottomRightRadius: '10px',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        zIndex: 1,
                        '&:hover': {color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)'},
                    }}
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
                    sx={{
                        width: open ? WING_WIDTH : 0,
                        opacity: open ? 1 : 0,
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
                        backgroundColor: '#1b243a',
                        backdropFilter: 'blur(20px)',
                        border: open ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderTopRightRadius: '16px',
                        borderBottomRightRadius: '16px',
                    }}
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
                                operators={operators}
                                isFetchingOperators={isFetchingOperators}
                                onCancel={onToggle}
                            />
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};