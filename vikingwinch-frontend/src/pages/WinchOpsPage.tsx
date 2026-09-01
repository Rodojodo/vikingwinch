import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, IconButton, Typography, Button, AppBar, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useMsal } from '@azure/msal-react';
import { WinchTab } from './WinchTab';
import { getWinchesForSquadron } from '../features/winch-ops/api/dataClient';
import type { WinchRead } from '../features/winch-ops/types';

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
        if (availableWinches.length > 0 && tabs.length >= availableWinches.length) return;
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
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0f172a' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: '#1b2438', backgroundImage: 'none', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#498ff8' }}>
                        {squadronId} — Winch Log
                    </Typography>
                    <Typography variant="body1" sx={{ mr: 2, color: '#f7f9fb', fontWeight: 500 }}>
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
                            color: '#f8fafc',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                            px: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                borderColor: '#3b82f6',
                                color: '#3b82f6',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        Sign out
                    </Button>
                </Toolbar>
            </AppBar>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', bgcolor: '#10172d', borderBottom: 1, borderColor: 'divider', px: 2, pt: 1.5 }}>
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
                                    <IconButton size="small" onClick={(e) => handleCloseTab(e, tab.id)} sx={{ p: 0.25, color: 'inherit', '&:hover': { color: '#f7f9fb', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                                        <CloseIcon sx={{ width: 14, height: 14 }} />
                                    </IconButton>
                                </Box>
                            } 
                            sx={{
                                minHeight: '48px',
                                px: 3,
                                backgroundColor: activeTabId === tab.id ? '#192336' : '#161e31',
                                borderRadius: '12px 12px 0 0',
                                opacity: 1,
                                mr: 1.5,
                                border: '1px solid',
                                borderColor: activeTabId === tab.id ? '#31394a' : 'transparent',
                                borderBottom: 'none',
                                color: activeTabId === tab.id ? '#f7f9fb' : '#909eb4',
                                transition: 'all 0.2s ease',
                                '&.Mui-selected': {
                                    color: '#f7f9fb',
                                },
                                '&:hover': {
                                    backgroundColor: activeTabId === tab.id ? '#192336' : '#1c263d',
                                    color: activeTabId === tab.id ? '#f7f9fb' : '#b0bed4',
                                }
                            }}
                        />
                    ))}
                </Tabs>
                <IconButton 
                    onClick={handleAddTab} 
                    disabled={availableWinches.length > 0 && tabs.length >= availableWinches.length} 
                    sx={{ 
                        color: '#909eb4', ml: 1, mb: 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#f7f9fb'
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
                    <Typography color="#909eb4">No active winches. Click '+' to open a new tab.</Typography>
                </Box>
            ) : (
                tabs.map((tab) => (
                    <Box key={tab.id} sx={{ display: activeTabId === tab.id ? 'flex' : 'none', flexDirection: 'column', flexGrow: 1 }}>
                        <WinchTab
                            tabId={tab.id}            // <-- Pass the tabId down
                            squadronId={squadronId}
                            operatorSn={operatorSn}
                            winchId={tab.winchId}
                            onWinchSelect={handleWinchSelect} // <-- Pass the stable reference directly! No arrow function.
                        />
                    </Box>
                ))
            )}
            </Box>
        </Box>
    );
};
