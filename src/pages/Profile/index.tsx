import React, { useContext } from 'react';
import ProfilePage from 'components/Profile';
import PostList from 'components/PostList';
import AppBarHeader from "components/Header";
import AppBottomNav from 'components/BottomNavigation';
import AuthContext from 'Context/AuthContext';

export default function Profile() {
    const { user } = useContext(AuthContext);

    return(
        <div>
            <AppBarHeader title={user?.displayName || 'Profile'} showBackButton={false}/>
            <ProfilePage />
            <AppBottomNav/>
        </div>
    )
}
