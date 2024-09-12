import React, { useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, IconButton, Tooltip } from '@mui/material';
import AuthContext from 'Context/AuthContext';
import ThemeContext from './ThemeContext';
import { IoChatbubbleEllipses } from "react-icons/io5";
import { TiArrowLeft } from "react-icons/ti";
import { BiMessageRoundedDots } from "react-icons/bi"
import { BiSun, BiMoon } from "react-icons/bi";

interface AppBarHeaderProps {
    title?: string;
    showBackButton?: boolean;
}

export default function AppBarHeader({ title, showBackButton } : AppBarHeaderProps ) {
    const { user } = useContext(AuthContext);
    const context = useContext(ThemeContext);
    const { theme, toggleMode } = useContext(ThemeContext);
    const navigate = useNavigate();

    const BackClick = () => {
        navigate(-1);
    };

    const LogoClick = () => {
        navigate('/');
    };



    return (
        <Box sx={{ 
                marginBottom: { xs: '56px', sm: '64px' }
            }} >
            <AppBar position="fixed" 
            sx={{ 
                
                    bgcolor: theme === 'light' ? '#F7F7F7' : '#1A1C22',
                    boxShadow: 'none'
                }}>
                <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0 10px'
            }}>
                    <Box sx={{ display: 'flex', alignItems: 'center'}}>
                        {showBackButton && (
                            <IconButton 
                            sx={{ color: theme === 'light' ? '#212121' : '#F7F7F7' }}
                            onClick={BackClick}>
                                <TiArrowLeft/>
                            </IconButton>
                        )}

                            {title ? (
                        <div
                            style={{ 
                                color: theme === 'light' ? '#212121' : '#F7F7F7', 
                                fontWeight: 'bold',
                            }}
                        >
                            {title}
                        </div>
                    ) : (
                        <div 
                            onClick={LogoClick} 
                            style={{ 
                                cursor: 'pointer', 
                                color: theme === 'light' ? '#212121' : '#F7F7F7', 
                                fontWeight: 'bold', 
                                fontSize: '16px'
                            }}
                        >
                            MyReactSNS
                        </div>
                    )}

                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    
                    {context.theme === 'light' ? 
                    <BiSun onClick={context.toggleMode} className='thememodeBtn' size={22} color="#424242"/> : 
                    <BiMoon onClick={context.toggleMode} className='thememodeBtn' size={22} color="#F7F7F7"/> }
                    
    
                    <Link to={'/chatlist'}>
                        <Tooltip title="Chat">
                            <IconButton 
                            sx={{ color:  theme === 'light' ? '#212121' : '#F7F7F7'}}
                            >
                                <BiMessageRoundedDots />
                            
                                    </IconButton>
                        </Tooltip>
                    </Link>
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
