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
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const navigate = useNavigate();

    // console.log('안 읽은 메세지 카운트', unreadMessagesCount); 
    useEffect(() => {
    if (!user?.uid) return;

    const userDocRef = doc(db, 'Users', user.uid);

    const filterUser = onSnapshot(userDocRef, async (userSnap) => {
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const userChatRooms = userData.chatRooms || [];

        if (userChatRooms.length === 0) return;
        const chatRoomsRef = collection(db, 'ChatRooms');

        const filterChatRoom = onSnapshot(chatRoomsRef, (roomsSnap) => {
            const totalUnreadCount = roomsSnap.docs
                .filter(room => userChatRooms.includes(room.id)) 
                .reduce((total, room) => { // reduce 로 현재 값 filter 한 room 매개변수를 가지고
                    const roomData = room.data() as ChatRoomProps; // 챗루ㅁ 인터페이ㅡㄹ를 참조하여 변수에 담고 
                    // console.log(roomData)
                    const unreadCount = roomData.unreadMessages?.[user.uid] || 0;
                    // console.log(unreadCount)

                    return total + unreadCount; // 읽지 않은 메시지 수 더하기
                }, 0); // 초기값 0 설정
            // 총 읽지 않은 메시지 수 업데이트
            setUnreadMessagesCount(totalUnreadCount);
        });
        return () => filterChatRoom();
    });
    return () => filterUser();
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
                    <BiMoon onClick={context.toggleMode} className='thememodeBtn' size={25} color="#F7F7F7"/> }
                    
    
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
