import React from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { SxProps, Theme } from '@mui/material/styles';
import { glassPanelSx } from '../../../themes/styles';
import type { OperatorQualificationsRead, QualificationState } from '../types';

export interface StarsStatusGraphicProps {
    qualifications: OperatorQualificationsRead | null;
    onRefresh?: () => void | Promise<void>;
    isRefreshing?: boolean;
}

interface QualItem {
    id: string;
    label: string;
    emoticon: string;
    state: QualificationState;
}

const statusColorMap: Record<QualificationState, { bg: string; text: string; border: string }> = {
    green: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: '#22c55e' },
    amber: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '#f59e0b' },
    blue: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6' },
    red: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: '#ef4444' },
    nil: { bg: 'transparent', text: '#9ca3af', border: '#4b5563' },
};

export const StarsStatusGraphic: React.FC<StarsStatusGraphicProps> = ({
    qualifications,
    onRefresh,
    isRefreshing = false,
}) => {
    const items: QualItem[] = [];

    if (qualifications) {
        if (qualifications.c005_operator !== 'nil') {
            items.push({
                id: 'c005',
                label: 'Operator',
                emoticon: '🚜',
                state: qualifications.c005_operator,
            });
        }
        if (qualifications.e004_instructor !== 'nil') {
            items.push({
                id: 'e004',
                label: 'Instructor',
                emoticon: '🎓',
                state: qualifications.e004_instructor,
            });
        }
        if (qualifications.c003_examiner !== 'nil') {
            items.push({
                id: 'c003',
                label: 'Examiner',
                emoticon: '🧐',
                state: qualifications.c003_examiner,
            });
        }
        if (qualifications.rolling_currency && qualifications.rolling_currency !== 'nil') {
            items.push({
                id: 'rolling',
                label: 'Rolling Currency',
                emoticon: '🔄',
                state: qualifications.rolling_currency,
            });
        }
    }

    return (
        <Box sx={[glassPanelSx, { maxWidth: 540, p: 3, mt: 3, gap: 2 }] as SxProps<Theme>}>
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    STARS Qualifications
                </Typography>
                {onRefresh && (
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        startIcon={isRefreshing ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon fontSize="small" />}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            color: 'text.secondary',
                            borderColor: 'surface.border',
                            '&:hover': {
                                borderColor: 'primary.main',
                                color: 'primary.main',
                            },
                        }}
                    >
                        Refresh status
                    </Button>
                )}
            </Box>

            {items.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                    {qualifications ? 'No active qualifications recorded.' : 'Loading qualification status...'}
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, width: '100%', mt: 0.5 }}>
                    {items.map(item => {
                        const style = statusColorMap[item.state] || statusColorMap.nil;
                        return (
                            <Box
                                key={item.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    borderRadius: '12px',
                                    backgroundColor: style.bg,
                                    border: '1px solid',
                                    borderColor: style.border,
                                }}
                            >
                                <Typography sx={{ fontSize: '1.25rem' }}>{item.emoticon}</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {item.label}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            color: style.text,
                                        }}
                                    >
                                        {item.state}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};
