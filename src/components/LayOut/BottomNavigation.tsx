import React, { useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Avatar from '@mui/material/Avatar';
import { Link, useLocation } from 'react-router-dom';
import Badge from '@mui/material/Badge';

import { BiHome, BiSearch, BiPlusCircle, BiBell } from "react-icons/bi";
import { RiSignpostLine } from "react-icons/ri";
import { LuSmilePlus } from "react-icons/lu";
import AuthContext from 'Context/AuthContext';
import ThemeContext from '../../Context/ThemeContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from 'firebaseApp';

//노티피케이션 쿼리를 가져와서 그 안에서 실시간으로 감지 할건데 안 읽은 메세지만 필터링할 때 현재 유저가 받은 알림 에서 안 읽은 거만 필터링해서 useState의 값으로 보내서 ui에 띄워라

export default function AppBottomNav() {
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const iconColor = theme === 'light' ? '#212121' : '#F7F7F7';
    const activeIconColor = theme === 'light' ? '#580Ef6' : '#580Ef6';

useEffect(() => {
    if (user) {
        const notificationsRef = collection(db, 'Notification');
        const notificationQuery = query(
            notificationsRef,
            where('uid', '==', user.uid)
        );

        const filterNotification = onSnapshot(notificationQuery, (snapshot) => {
            const unreadNotifications = snapshot.docs.filter(doc => !doc.data().isRead);
            // notificationQuery 위에서 쿼리로 현재 로그인한 유저가 받은 알림만 골라낸 거에서 안 읽은 거만 골라내라 
            setUnreadCount(unreadNotifications.length);
        });

        return () => filterNotification();
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
                value={location.pathname} 
            >
                <BottomNavigationAction
                    component={Link}
                    to="/"
                    icon={<BiHome size={24} />}
                    sx={{
                        color: location.pathname === '/' ? activeIconColor : iconColor,
                    }}
                />
                <BottomNavigationAction
                    component={Link}
                    to="/Search"
                    icon={<BiSearch size={24} />}
                    sx={{
                        color: location.pathname === '/Search' ? activeIconColor : iconColor,
                    }}
                />
                <BottomNavigationAction
                    component={Link}
                    to="/Posts/new"
                    icon={<LuSmilePlus size={30} />}
                    sx={{
                        color: location.pathname === '/Posts/new' ? activeIconColor : iconColor,
                    }}
                />
                <BottomNavigationAction
                    component={Link}
                    to="/Notification"
                    icon={
                        <Badge
                            badgeContent={unreadCount}
                            color="error"
                            invisible={unreadCount === 0}
                        >
                            <BiBell size={30} />
                        </Badge>
                    }
                    sx={{ color: location.pathname === '/Notification' ? activeIconColor : iconColor }}
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
                    sx={{
                        color: location.pathname === '/Profile' ? activeIconColor : iconColor,
                    }}
                />
            </BottomNavigation>
        </Box>
    );
}
