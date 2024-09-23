import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Tabs, Tab, Skeleton } from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from 'firebaseApp';
import ThemeContext from '../Context/ThemeContext';
import AppBarHeader from './LayOut/Header';
import { UserProps, FollowInfo } from 'types/InterfaceTypes';

export default function UserFollowingList() {
    const { id } = useParams<{ id: string }>();
    const { theme } = useContext(ThemeContext);
    const [tabIndex, setTabIndex] = useState<number>(0);
    const [followers, setFollowers] = useState<FollowInfo[]>([]);
    const [following, setFollowing] = useState<FollowInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [userInfo, setUserInfo] = useState<UserProps | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
    if (id) {
        const userRef = doc(db, 'Users', id);

        const getUserSnap = onSnapshot(userRef, async (user) => {
            if (user.exists()) {
                setUserInfo(user.data() as UserProps);
                
                const followersData = await getUsersData(user.data().followers || []);
                // getUsersData 안에서 followers 배열을 받는데 비어있을 수도 있으니 || [] 빈배열 처리 
                setFollowers(followersData.filter(user => user !== null) as FollowInfo[]);
                
                const followingData = await getUsersData(user.data().following || []);
                setFollowing(followingData.filter(user => user !== null) as FollowInfo[]);
            }
            setLoading(false);
        });

        return () => {
            getUserSnap();
        };
    }
}, [id]);

const getUsersData = async (userIds: string[]) => {
    
    return await Promise.all(userIds.map(async (userId) => {
        const userDoc = await getDoc(doc(db, 'Users', userId));
        return userDoc.exists() ? (userDoc.data() as FollowInfo) : null;
    }));
};

    const TabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
        const tab = newValue === 0 ? 'followers' : 'following';
        navigate(`?tab=${tab}`, { replace: true });
    };
    return (
        <div>
            <AppBarHeader title={userInfo?.displayName || '상대방 이름'} showBackButton={true} />
            <div className='TabBox_section'>
                <Tabs
                    value={tabIndex}
                    onChange={TabChange}
                    sx={{
                        justifyContent: 'center',
                        width: '100%',
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#580Ef6'
                        }
                    }}
                >
                    <Tab label={`팔로워 ${followers.length}`} sx={{
                        maxWidth: 'none',
                        '&.Mui-selected': {
                            fontWeight: 'bold',
                            background: theme === 'light' ? '#F7F7F7' : '#3D3A50',
                            color: theme === 'light' ? '#580Ef6' : '#F7F7F7'
                        },
                        flex: 1, textAlign: 'center',
                        color: theme === 'light' ? '#1A1C22' : '#F7F7F7',
                    }} />
                    <Tab label={`팔로잉 ${following.length}`} sx={{
                        maxWidth: 'none',
                        '&.Mui-selected': {
                            fontWeight: 'bold',
                            background: theme === 'light' ? '#F7F7F7' : '#3D3A50',
                            color: theme === 'light' ? '#580Ef6' : '#F7F7F7'
                        },
                        flex: 1, textAlign: 'center',
                        color: theme === 'light' ? '#1A1C22' : '#F7F7F7',
                    }} />
                </Tabs>
                <div role="tabpanel">
                    {loading ? (
                        <div className="Searchresults">
                            <ul className='SearchArea'>
                                {[...Array(5)].map((_, index) => (
                                    <li key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', padding: '1em' }}>
                                        <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="circular" width={50} height={50} />
                                        <div style={{ flex: 1 }}>
                                            <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={100} />
                                            <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={150} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="Searchresults">
                            {tabIndex === 0 && (
                                <ul className='SearchArea'>
                                    {followers.length > 0 ? followers.map(follower => (
                                        <li
                                            key={follower.id}
                                            style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', padding: '0.5em' }}
                                        >
                                            <Link to={`/user/${follower.id}`}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <Avatar
                                                        src={follower.photoURL || ''}
                                                        alt={follower.displayName || 'User'}
                                                        sx={{ width: '50px', height: '50px' }}
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span className='followname'>{follower.displayName}</span >
                                                        <span className='followemail'>{follower.email}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                            
                                        </li>
                                    )) : (
                                        <p className="noPostlist">팔로워가 없습니다.</p>
                                    )}
                                </ul>
                            )}
                            {tabIndex === 1 && (
                                <ul className='SearchArea'>
                                    {following.length > 0 ? following.map(followingUser => (
                                        <li
                                            key={followingUser.id}
                                            style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', padding: '0.5em' }}
                                        >
                                            <Link to={`/user/${followingUser.id}`}>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <Avatar
                                                        src={followingUser.photoURL || ''}
                                                        alt={followingUser.displayName || 'User'}
                                                        sx={{ width: '50px', height: '50px' }}
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span className='followname'>{followingUser.displayName}</span >
                                                        <span className='followemail'>{followingUser.email}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </li>
                                    )) : (
                                        <p className="noPostlist">팔로잉하는 사용자가 없습니다.</p>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}