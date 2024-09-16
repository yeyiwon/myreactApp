import React from 'react';
import { CircularProgress } from '@mui/material';

interface LoadingScreenProps {
    isLoading: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
    if (!isLoading) return null;

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            // backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            zIndex: 1000 
        }}>
            <CircularProgress
                size={30}
                sx={{ color: '#580EF6' }}
            />
        </div>
    );
};

export default LoadingScreen;
