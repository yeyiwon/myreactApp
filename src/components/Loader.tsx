import React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import ThemeContext from './ThemeContext';

export default function LinearLoader() {
    const { theme } = React.useContext(ThemeContext);
    return (
        <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1000 }}>
        <LinearProgress 
            sx={{ 
                backgroundColor: theme === 'light' ? '#F7F7F7' : '#580EF6',
                '& .MuiLinearProgress-bar': { 
                    height: '3px',
                    backgroundColor: theme === 'light' ? '#580EF6' : '#F7F7F7'
            } 
        }} 
        
        />
        </Box>
    );
}
