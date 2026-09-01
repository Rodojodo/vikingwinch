import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, IconButton, Typography, Button, AppBar, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
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
    const [tabs, setTabs] = useState<TabData[]>([{ id: '1', winchId: null }]);
    const [activeTabId, setActiveTabId] = useState<string>('1');
    const [availableWinches, setAvailableWinches] = useState<WinchRead[]>([]);
    
    useEffect(() => {
        getWinchesForSquadron(squadronId).then(setAvailableWinches).catch(console.error);
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
        if (activeTabId === idToClose && newTabs.length > 0) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0f172a' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: '#1b2438', backgroundImage: 'none', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#498ff8' }}>
                        {squadronId} — Winch Log
                    </Typography>
                    <Typography variant="body1" sx={{ mr: 2, color: '#f7f9fb', fontWeight: 500 }}>
                        {operatorSn}
                    </Typography>
                    <Button color="inherit" variant="outlined" size="small" sx={{ textTransform: 'none' }}>Sign out</Button>
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
            
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
                {tabs.map((tab) => (
                    <Box key={tab.id} sx={{ display: activeTabId === tab.id ? 'block' : 'none', height: '100%' }}>
                        <WinchTab 
                            squadronId={squadronId} 
                            operatorSn={operatorSn} 
                            winchId={tab.winchId} 
                            onWinchSelect={(winchId) => {
                                setTabs(tabs.map(t => t.id === tab.id ? { ...t, winchId } : t));
                            }} 
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
