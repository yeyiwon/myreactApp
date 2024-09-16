import React, { useContext, useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, IconButton, Tooltip, Badge } from '@mui/material';
import AuthContext from 'Context/AuthContext';
import ThemeContext from '../../Context/ThemeContext';
import { IoChatbubbleEllipses } from "react-icons/io5";
import { TiArrowLeft } from "react-icons/ti";
import { BiMessageRoundedDots } from "react-icons/bi"
import { BiSun, BiMoon } from "react-icons/bi";
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from 'firebaseApp';

import ChatList from '../Chat/ChatList';

import { ChatRoomProps, UserProps, Message } from 'types/InterfaceTypes';

interface AppBarHeaderProps {
    title?: string;
    showBackButton?: boolean;
}

export default function AppBarHeader({ title, showBackButton=false } : AppBarHeaderProps ) {
    const { user } = useContext(AuthContext);
    const context = useContext(ThemeContext);
    const { theme, toggleMode } = useContext(ThemeContext);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
    const navigate = useNavigate();
    console.log('Unread messages count:', unreadMessagesCount); 

useEffect(() => {
        const fetchChatRooms = async () => {
            if (user?.uid) {
                const userDoc = doc(db, 'Users', user.uid);

                const unsubscribeUser = onSnapshot(userDoc, async (userSnap) => {
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        const userChatRooms: string[] = userData.chatRooms || [];
                        
                        const chatRoomsCollection = collection(db, 'ChatRooms');
                        
                        const unsubscribeChatRooms = onSnapshot(chatRoomsCollection, async (chatRoomsSnapshot) => {
                            const rooms = chatRoomsSnapshot.docs
                                .filter(doc => userChatRooms.includes(doc.id))
                                .map(async (doc) => {
                                    const roomData = doc.data() as ChatRoomProps; // Use ChatRoomProps here
                                    const unreadMessagesCount = roomData.unreadMessages?.[user.uid] || 0;

                                    return {
                                        
                                        ...roomData,
                                        unreadMessagesCount
                                    } as ChatRoomProps;
                                });

                            const resolvedRooms = await Promise.all(rooms);
                            const totalUnreadCount = resolvedRooms.reduce((acc, room) => acc + (room.unreadMessagesCount || 0), 0);
                            setUnreadMessagesCount(totalUnreadCount);
                        });

                        return () => {
                            unsubscribeChatRooms();
                        };
                    }
                });

                return () => {
                    unsubscribeUser();
                };
            }
        };

        fetchChatRooms();
    }, [user?.uid]);

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
                    <BiSun onClick={context.toggleMode} className='thememodeBtn' size={25} color="#424242"/> : 
                    <BiMoon onClick={context.toggleMode} className='thememodeBtn' size={28} color="#F7F7F7"/> }
                    
    
                    <Link to={'/chatlist'}>
                        <Tooltip title="Chat">
                            <IconButton 
                            sx={{ color:  theme === 'light' ? '#212121' : '#F7F7F7'}}
                            >
                                {unreadMessagesCount > 0 ? (
                                        <Badge badgeContent={unreadMessagesCount} color="error">
                                            <BiMessageRoundedDots />
                                        </Badge>
                                    ) : (
                                        <BiMessageRoundedDots />
                                    )}
                            
                                    </IconButton>
                        </Tooltip>
                    </Link>
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
