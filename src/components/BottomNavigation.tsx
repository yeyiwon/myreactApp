import React, { useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Avatar from '@mui/material/Avatar';
import { Link } from 'react-router-dom';
import Badge from '@mui/material/Badge';

import { BiHome, BiSearch, BiPlusCircle, BiBell } from "react-icons/bi";
import { RiSignpostLine } from "react-icons/ri";

import AuthContext from 'Context/AuthContext';
import ThemeContext from './ThemeContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from 'firebaseApp';

export default function AppBottomNav() {
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const [unreadCount, setUnreadCount] = useState(0);
    const iconColor = theme === 'light' ? '#212121' : '#F7F7F7';

        useEffect(() => {
        if (user) {
            const notificationsRef = collection(db, 'Notification');
            const notificationQuery = query(
                notificationsRef,
                where('uid', '==', user.uid),
                where('isRead', '==', false) // 읽지 않은 알림만 필터링
            );

            const unsubscribe = onSnapshot(notificationQuery, (snapshot) => {
                setUnreadCount(snapshot.size); // 읽지 않은 알림 수 업데이트
            });

            return () => unsubscribe();
        }
    }, [user]);


    return (
        <Box sx={{ 
            position: 'fixed',
            bottom: 0,
            left: 0,
            height: '64px',
            width: '100%',
            bgcolor: theme === 'light' ? '#F7F7F7' : '#1A1C22',
            boxShadow: 3,
        }}>
            <BottomNavigation
                sx={{ background: 'inherit' }}
            >
                <BottomNavigationAction
                    component={Link}
                    to="/"
                    icon={<BiHome size={24} />}
                    sx={{
                        color: iconColor,
                    }}
                />
                <BottomNavigationAction
                    component={Link}
                    to="/Search"
                    icon={<BiSearch size={24} />}
                    sx={{
                        color: iconColor,
                    }}
                />
                <BottomNavigationAction
                    component={Link}
                    to="/Posts/new"
                    icon={
                        <BiPlusCircle size={30} />
                    }
                    sx={{
                        color: iconColor,
                    }}
                />

                <BottomNavigationAction
                    component={Link}
                    to="/Notification"
                    icon={
                        <Badge
                            badgeContent={unreadCount}
                            color="error"
                            invisible={unreadCount === 0} // unreadCount가 0이면 뱃지 숨기기
                        >
                            <BiBell size={30} />
                        </Badge>
                    }
                    sx={{ color: iconColor }}
                />
                <BottomNavigationAction
                    component={Link}
                    to="/Profile"
                    icon={
                            <Avatar
                                src={user?.photoURL || ''}
                                alt="Profile"
                                sx={{ width: 40, height: 40, objectFit: 'cover' }}
                            />
                    }
                />
            </BottomNavigation>
        </Box>
    );
}
