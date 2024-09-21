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

    const fetchFollowers = async () => {
        if (userInfo?.followers) {
            try {
                const followersPromises = userInfo.followers.map(async (followerId) => {
                    const followerDoc = await getDoc(doc(db, 'Users', followerId));
                    return followerDoc.exists() ? (followerDoc.data() as FollowInfo) : null;
                });
                const followersData = await Promise.all(followersPromises);
                setFollowers(followersData.filter(Boolean) as FollowInfo[]);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const fetchFollowing = async () => {
        if (userInfo?.following) {
            try {
                const followingPromises = userInfo.following.map(async (followingId) => {
                    const followingDoc = await getDoc(doc(db, 'Users', followingId));
                    return followingDoc.exists() ? (followingDoc.data() as FollowInfo) : null;
                });
                const followingData = await Promise.all(followingPromises);
                setFollowing(followingData.filter(Boolean) as FollowInfo[]);
            } catch (error) {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        if (id) {
            const userRef = doc(db, 'Users', id);
            const fetchUserInfo = async () => {
                try {
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        setUserInfo(userDoc.data() as UserProps);
                    }
                } catch (error) {
                    console.error(error);
                }
            };

            fetchUserInfo(); 
            setLoading(false);

            const unsubscribe = onSnapshot(userRef, (doc) => {
                setUserInfo(doc.data() as UserProps);
            });

            return () => {
                unsubscribe();
            };
        }
    }, [id]);

    useEffect(() => {
        if (userInfo) {
            fetchFollowers();
            fetchFollowing();
        }
    }, [userInfo]);

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
