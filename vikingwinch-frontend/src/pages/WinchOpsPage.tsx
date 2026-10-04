import React, {useCallback, useEffect, useState} from 'react';
import {AppBar, Box, Button, IconButton, Tab, Tabs, Toolbar, Typography} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import {useMsal} from '@azure/msal-react';
import {UserButton} from '@clerk/react';
import {WinchTab} from './WinchTab';
import {getWinchesForSquadron} from '../features/winch-ops/api/winchClient';
import type {WinchRead} from '../features/winch-ops/types';
import {AUTH_PROVIDER} from './App';
import {
    compactAppBarSx,
    compactAppBarTitleSx,
    compactOperatorNameSx,
    compactTabBarSx,
    compactTabCloseButtonSx,
    compactTabLabelSx,
    compactTabSx,
    compactToolbarSx,
    compactUserButtonWrapperSx,
} from '../themes/styles.ts';

interface WinchOpsPageProps {
    squadronId: string;
    operatorSn: string;
}

interface TabData {
    id: string;
    winchId: number | null;
}

export const WinchOpsPage = ({ squadronId, operatorSn }: WinchOpsPageProps) => {
    // MSAL account handling preserved for production
    const { accounts, instance } = useMsal();
    const activeAccount = instance?.getActiveAccount ? instance.getActiveAccount() || accounts?.[0] : undefined;
    const operatorName = AUTH_PROVIDER === 'clerk' ? operatorSn : (activeAccount?.name || 'Unknown Operator');

    const [tabs, setTabs] = useState<TabData[]>([{ id: '1', winchId: null }]);
    const [activeTabId, setActiveTabId] = useState<string>('1');
    const [availableWinches, setAvailableWinches] = useState<WinchRead[]>([]);

    useEffect(() => {
        let isMounted = true;
        getWinchesForSquadron(squadronId)
            .then(data => {
                if (isMounted) setAvailableWinches(data);
            })
            .catch(err => {
                if (isMounted) {
                    console.error('Failed to load winches:', err);
                }
            });
        return () => {
            isMounted = false;
        };
    }, [squadronId]);

    const handleAddTab = () => {
        if (availableWinches.length > 0 && tabs.length >= availableWinches.length) {
            return;
        }
        const newId = Date.now().toString();
        setTabs([...tabs, { id: newId, winchId: null }]);
        setActiveTabId(newId);
    };

    const handleCloseTab = (e: React.MouseEvent | React.KeyboardEvent, idToClose: string) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== idToClose);
        setTabs(newTabs);

        if (newTabs.length === 0) {
            setActiveTabId('');
        } else if (activeTabId === idToClose) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const handleWinchSelect = useCallback((tabId: string, newWinchId: number) => {
        setTabs(prevTabs =>
            prevTabs.map(t => t.id === tabId ? { ...t, winchId: newWinchId } : t)
        );
    }, []);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default'}}>
            <AppBar
                position="static"
                elevation={0}
                sx={compactAppBarSx}
            >
                <Toolbar sx={compactToolbarSx}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={compactAppBarTitleSx}
                    >
                        Winch Log
                    </Typography>
                    <Typography variant="body1" sx={compactOperatorNameSx}>
                        {operatorName}
                    </Typography>
                    {AUTH_PROVIDER === 'clerk' ? (
                        <Box sx={compactUserButtonWrapperSx}>
                            <UserButton/>
                        </Box>
                    ) : (
                        <Button
                            size="small"
                            onClick={() => instance.logoutRedirect().catch(console.error)}
                            sx={{
                                textTransform: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: 'text.primary',
                                overflow: 'hidden',
                                transition: 'all 0.2s ease',
                                px: {xs: 1, sm: 2},
                                fontSize: {xs: '0.7rem', sm: '0.85rem'},
                                '&:hover': {
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    borderColor: 'primary.main',
                                    color: 'primary.main',
                                    transform: 'translateY(-2px)',
                                },
                            }}
                        >
                            Sign out
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <Box sx={compactTabBarSx}>
                <Tabs
                    value={activeTabId}
                    onChange={(_, nv) => setActiveTabId(nv)}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="inherit"
                    sx={{
                        minHeight: {xs: '36px', sm: '48px'},
                        '& .MuiTabs-indicator': {display: 'none'},
                    }}
                >
                    {tabs.map((tab) => (
                        <Tab
                            key={tab.id}
                            value={tab.id}
                            disableRipple
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography sx={{ ...compactTabLabelSx, fontWeight: activeTabId === tab.id ? 500 : 400, color: 'inherit' }}>
                                        {tab.winchId ? `Winch ${tab.winchId}` : 'New Winch'}
                                    </Typography>
                                    <Box
                                        component="span"
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => handleCloseTab(e, tab.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleCloseTab(e, tab.id);
                                            }
                                        }}
                                        sx={compactTabCloseButtonSx}
                                    >
                                        <CloseIcon sx={{ width: 12, height: 12 }} />
                                    </Box>
                                </Box>
                            }
                            sx={{
                                ...compactTabSx,
                                backgroundColor: activeTabId === tab.id ? 'surface.card' : 'surface.card',
                                border: '1px solid',
                                borderColor: activeTabId === tab.id ? 'surface.border' : 'transparent',
                                borderBottom: 'none',
                                color: activeTabId === tab.id ? 'text.primary' : 'text.secondary',
                                opacity: 1,
                                '&:hover': {
                                    backgroundColor: activeTabId === tab.id ? 'surface.card' : 'surface.card',
                                    color: activeTabId === tab.id ? 'text.primary' : 'text.secondary',
                                },
                            }}
                        />
                    ))}
                </Tabs>
                <IconButton
                    onClick={handleAddTab}
                    disabled={availableWinches.length > 0 && tabs.length >= availableWinches.length}
                    sx={{
                        color: 'text.secondary', ml: 1, mb: 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'text.primary',
                        },
                        '&.Mui-disabled': {color: 'rgba(255,255,255,0.2)'},
                        width: {xs: 32, sm: 40},
                        height: {xs: 32, sm: 40},
                    }}
                >
                    <AddIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {tabs.length === 0 ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1}}>
                        <Typography color="text.secondary">No active winches. Click &apos;+&apos; to open a new
                            tab.</Typography>
                    </Box>
                ) : (
                    tabs.map((tab) => (
                        <Box key={tab.id} sx={{
                            display: activeTabId === tab.id ? 'flex' : 'none',
                            flexDirection: 'column',
                            flexGrow: 1
                        }}>
                            <WinchTab
                                tabId={tab.id}
                                squadronId={squadronId}
                                operatorSn={operatorSn}
                                winchId={tab.winchId}
                                openWinchIds={tabs.map(t => t.winchId).filter((id): id is number => id !== null)}
                                onWinchSelect={handleWinchSelect}
                            />
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
};
