import React, {useEffect, useRef, useState} from 'react';
import {Box, Button, TextField, Typography} from '@mui/material';
import {getBroughtForward} from '../api/winchClient.ts';
import {useSessionIdentity} from '../../../app/hooks/useSessionIdentity.ts';
import {darkTextFieldStyles, errorBannerSx, glassPanelSx, glowingPrimaryButtonSx} from '../../../themes/styles.ts';
import type {SxProps, Theme} from '@mui/material/styles';

interface DailyInspectionPanelProps {
    onComplete: () => void;
    onSignDI?: (hours: number | null) => Promise<void>;
    onSubmitCorrections?: (corrections: { left: number | null; right: number | null }) => Promise<unknown>;
}

export const DailyInspectionPanel: React.FC<DailyInspectionPanelProps> = ({
    onComplete,
    onSignDI,
    onSubmitCorrections,
}) => {
    const {squadronId, operatorSn, winchId} = useSessionIdentity();
    const [leftDrum, setLeftDrum] = useState<string>('');
    const [rightDrum, setRightDrum] = useState<string>('');
    const [hours, setHours] = useState<string>('');
    const [cloudLeft, setCloudLeft] = useState<number | null>(null);
    const [cloudRight, setCloudRight] = useState<number | null>(null);
    const [cloudHours, setCloudHours] = useState<number | null>(null);
    const [diSigned, setDiSigned] = useState(false);
    const [isFetching, setIsFetching] = useState(Boolean(winchId));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cloudValuesRef = useRef<{ left: number | null; right: number | null; hours: number | null }>({
        left: null,
        right: null,
        hours: null,
    });
    const fetchPromiseRef = useRef<Promise<void> | null>(null);

    useEffect(() => {
        if (!winchId) return;
        let isMounted = true;

        const promise = (async () => {
            setIsFetching(true);
            setError(null);
            try {
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const bf = await getBroughtForward(winchId, todayStr);
                if (isMounted && bf) {
                    const l = bf.left !== null && bf.left !== undefined ? bf.left : null;
                    const r = bf.right !== null && bf.right !== undefined ? bf.right : null;
                    const hrs = bf.hours !== null && bf.hours !== undefined ? bf.hours : null;
                    cloudValuesRef.current.left = l;
                    cloudValuesRef.current.right = r;
                    cloudValuesRef.current.hours = hrs;
                    setCloudLeft(l);
                    setCloudRight(r);
                    setCloudHours(hrs);
                }
            } catch (e) {
                console.error('Failed to fetch brought forward data', e);
                if (isMounted) setError('Failed to retrieve brought forward data.');
            } finally {
                if (isMounted) {
                    setIsFetching(false);
                }
            }
        })();

        fetchPromiseRef.current = promise;

        return () => {
            isMounted = false;
        };
    }, [winchId]);

    const handlePopulateFromCloud = async () => {
        if (!winchId) return;
        if (fetchPromiseRef.current) {
            await fetchPromiseRef.current;
        }
        const {left, right, hours: h} = cloudValuesRef.current;
        if (left !== null) {
            setLeftDrum(left.toString());
        }
        if (right !== null) {
            setRightDrum(right.toString());
        }
        if (h !== null) {
            setHours(h.toString());
        }
    };

    const handleDrumKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['.', '-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleLeftDrumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d+$/.test(val)) {
            setLeftDrum(val);
        }
    };

    const handleRightDrumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d+$/.test(val)) {
            setRightDrum(val);
        }
    };

    const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || (/^\d*\.?\d*$/.test(val) && !val.startsWith('-'))) {
            setHours(val);
        }
    };

    const parsedLeft = leftDrum !== '' ? parseInt(leftDrum, 10) : null;
    const parsedRight = rightDrum !== '' ? parseInt(rightDrum, 10) : null;
    const parsedHours = hours !== '' ? parseFloat(hours) : null;

    const leftDiffers = cloudLeft !== null && parsedLeft !== null && !isNaN(parsedLeft) && parsedLeft !== cloudLeft;
    const rightDiffers = cloudRight !== null && parsedRight !== null && !isNaN(parsedRight) && parsedRight !== cloudRight;
    const hoursDiffers = cloudHours !== null && parsedHours !== null && !isNaN(parsedHours) && parsedHours !== cloudHours;

    const handleSignDI = async () => {
        if (!winchId || !squadronId || !operatorSn) return;
        setIsSubmitting(true);
        setError(null);

        const validHours = parsedHours !== null && !isNaN(parsedHours) ? parsedHours : null;
        const leftChanged = parsedLeft !== null && !isNaN(parsedLeft) && (cloudLeft === null || parsedLeft !== cloudLeft);
        const rightChanged = parsedRight !== null && !isNaN(parsedRight) && (cloudRight === null || parsedRight !== cloudRight);
        const drumsChanged = leftChanged || rightChanged;

        let signed = diSigned;
        if (!signed) {
            try {
                if (onSignDI) {
                    await onSignDI(validHours);
                }
                signed = true;
                setDiSigned(true);
            } catch (e) {
                console.error('Failed to sign DI', e);
                setError('Failed to submit Daily Inspection.');
                setIsSubmitting(false);
                return;
            }
        }

        if (drumsChanged && onSubmitCorrections) {
            try {
                await onSubmitCorrections({
                    left: leftChanged ? parsedLeft : null,
                    right: rightChanged ? parsedRight : null,
                });
            } catch (e) {
                console.error('Failed to submit drum corrections', e);
                setError('Failed to submit drum corrections.');
                setIsSubmitting(false);
                return;
            }
        }

        setIsSubmitting(false);
        onComplete();
    };

    return (
        <Box sx={[glassPanelSx, {maxWidth: 540, gap: 3}] as SxProps<Theme>}>
            {error && (
                <Typography variant="body2" sx={errorBannerSx}>
                    {error}
                </Typography>
            )}
            <Typography variant="h2">
                Winch {winchId}
            </Typography>

            <Typography variant="subtitle1">
                This winch has not been used today. A Daily Inspection is required.
            </Typography>

            <Typography variant="subtitle1">
                Enter the current drum totals.
            </Typography>

            <Button
                variant="outlined"
                color="primary"
                onClick={handlePopulateFromCloud}
                disabled={isFetching || isSubmitting}
                sx={{
                    borderRadius: '20px',
                    px: 3,
                    '&:hover': {
                        backgroundColor: (theme) => `${theme.palette.primary.main}1a`,
                    },
                }}
            >
                Retrieve data from cloud
            </Button>

            <Box sx={{display: 'flex', gap: 2, width: '100%'}}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>
                        Left drum total
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. 12"
                        value={leftDrum}
                        onChange={handleLeftDrumChange}
                        onKeyDown={handleDrumKeyDown}
                        type="number"
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                        sx={darkTextFieldStyles}
                    />
                    {leftDiffers && (
                        <Typography variant="caption" sx={{ color: 'warning.main', mt: 0.5, display: 'block' }}>
                            {`Entered: ${leftDrum}, cloud: ${cloudLeft}`}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>
                        Right drum total
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. 5"
                        value={rightDrum}
                        onChange={handleRightDrumChange}
                        onKeyDown={handleDrumKeyDown}
                        type="number"
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                        sx={darkTextFieldStyles}
                    />
                    {rightDiffers && (
                        <Typography variant="caption" sx={{ color: 'warning.main', mt: 0.5, display: 'block' }}>
                            {`Entered: ${rightDrum}, cloud: ${cloudRight}`}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{width: '100%'}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>
                    Hours
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 123.5"
                    value={hours}
                    onChange={handleHoursChange}
                    onKeyDown={handleHoursKeyDown}
                    disabled={diSigned || isSubmitting}
                    type="number"
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    sx={darkTextFieldStyles}
                />
                {hoursDiffers && (
                    <Typography variant="caption" sx={{ color: 'warning.main', mt: 0.5, display: 'block' }}>
                        {`Entered: ${hours}, cloud: ${cloudHours}`}
                    </Typography>
                )}
            </Box>

            <Button
                variant="contained"
                color="success"
                disabled={isSubmitting || isFetching}
                onClick={handleSignDI}
                sx={[
                    glowingPrimaryButtonSx,
                    {py: 2, px: 5},
                ] as SxProps<Theme>}
            >
                {isSubmitting
                    ? (diSigned ? 'Submitting...' : 'Signing...')
                    : (diSigned ? 'Submit Drum Corrections' : 'Sign DI')}
            </Button>
        </Box>
    );
};
