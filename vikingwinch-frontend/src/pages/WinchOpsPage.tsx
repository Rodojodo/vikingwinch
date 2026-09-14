import React, {useCallback, useEffect, useState} from 'react';
import {AppBar, Box, Button, IconButton, Tab, Tabs, Toolbar, Typography} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import {useMsal} from '@azure/msal-react';
import {WinchTab} from './WinchTab';
import {getWinchesForSquadron} from '../features/winch-ops/api';
import type {WinchRead} from '../features/winch-ops/types';

interface WinchOpsPageProps {
    squadronId: string;
    operatorSn: string;
}

interface TabData {
    id: string;
    winchId: number | null;
}

export const WinchOpsPage = ({ squadronId, operatorSn }: WinchOpsPageProps) => {
    const { accounts, instance } = useMsal();
    const activeAccount = instance.getActiveAccount() || accounts[0];
    const operatorName = activeAccount?.name || 'Unknown Operator';

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
                    console.error("Failed to load winches:", err);
                }
            });
        return () => {
            isMounted = false;
        };
    }, [squadronId]);

    const handleAddTab = () => {
        const newId = Date.now().toString();
        setTabs([...tabs, { id: newId, winchId: null }]);
        setActiveTabId(newId);
    };

    const handleCloseTab = (e: React.MouseEvent, idToClose: string) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== idToClose);
        setTabs(newTabs);

        if (newTabs.length === 0) {
            setActiveTabId(''); // Clean up dirty state
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
            <AppBar position="static" elevation={0} sx={{
                bgcolor: 'surface.card',
                backgroundImage: 'none',
                boxShadow: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Toolbar>
                    <Typography variant="h6" component="div"
                                sx={{flexGrow: 1, fontWeight: 'bold', color: 'primary.main'}}>
                        {squadronId} — Winch Log
                    </Typography>
                    <Typography variant="body1" sx={{mr: 2, color: 'text.primary', fontWeight: 500}}>
                        {operatorName}
                    </Typography>
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
                            px: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        Sign out
                    </Button>
                </Toolbar>
            </AppBar>
            <Box sx={{
                display: 'flex',
                alignItems: 'flex-end',
                bgcolor: 'background.default',
                borderBottom: 1,
                borderColor: 'divider',
                px: 2,
                pt: 1.5
            }}>
                <Tabs 
                    value={activeTabId} 
                    onChange={(_, nv) => setActiveTabId(nv)} 
                    variant="scrollable" 
                    scrollButtons="auto"
                    textColor="inherit"
                    sx={{
                        minHeight: '48px',
                        '& .MuiTabs-indicator': { display: 'none' }
                    }}
                >
                    {tabs.map((tab) => (
                        <Tab 
                            key={tab.id} 
                            value={tab.id} 
                            disableRipple
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography sx={{ textTransform: 'none', mr: 2, fontWeight: activeTabId === tab.id ? 500 : 400, color: 'inherit' }}>
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
                                                handleCloseTab(e as any, tab.id);
                                            }
                                        }}
                                        sx={{ 
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            p: 0.25, 
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            color: 'inherit',
                                            '&:hover': {color: 'text.primary', bgcolor: 'rgba(255,255,255,0.1)'}
                                        }}
                                    >
                                        <CloseIcon sx={{ width: 14, height: 14 }} />
                                    </Box>
                                </Box>
                            } 
                            sx={{
                                minHeight: '48px',
                                px: 3,
                                backgroundColor: activeTabId === tab.id ? 'surface.card' : 'surface.card',
                                borderRadius: '12px 12px 0 0',
                                opacity: 1,
                                mr: 1.5,
                                border: '1px solid',
                                borderColor: activeTabId === tab.id ? 'surface.border' : 'transparent',
                                borderBottom: 'none',
                                color: activeTabId === tab.id ? 'text.primary' : 'text.secondary',
                                transition: 'all 0.2s ease',
                                '&.Mui-selected': {
                                    color: 'text.primary',
                                },
                                '&:hover': {
                                    backgroundColor: activeTabId === tab.id ? 'surface.card' : 'surface.card',
                                    color: activeTabId === tab.id ? 'text.primary' : 'text.secondary',
                                }
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
                            color: 'text.primary'
                        },
                        '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' }
                    }}
                >
                    <AddIcon fontSize="small" />
                </IconButton>
            </Box>
            
            <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {tabs.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                    <Typography color="text.secondary">No active winches. Click '+' to open a new tab.</Typography>
                </Box>
            ) : (
                tabs.map((tab) => (
                    <Box key={tab.id} sx={{ display: activeTabId === tab.id ? 'flex' : 'none', flexDirection: 'column', flexGrow: 1 }}>
                        <WinchTab
                            tabId={tab.id}            // <-- Pass the tabId down
                            squadronId={squadronId}
                            operatorSn={operatorSn}
                            winchId={tab.winchId}
                            openWinchIds={tabs.map(t => t.winchId).filter((id): id is number => id !== null)}
                            onWinchSelect={handleWinchSelect} // <-- Pass the stable reference directly! No arrow function.
                        />
                    </Box>
                ))
            )}
            </Box>
        </Box>
    );
};
