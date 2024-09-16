import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Tabs, Tab, Button, Skeleton } from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { arrayRemove, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import ThemeContext from '../Context/ThemeContext';
import AuthContext from 'Context/AuthContext';
import AppBarHeader from './LayOut/Header';
import { FollowInfo } from 'types/InterfaceTypes';
import { useCreateChatRoom } from './Chat/useCreateChatRoom';

export default function MyFollowingList() {
    const { id } = useParams<{ id: string }>();
    const { theme } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);

    const [tabIndex, setTabIndex] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [followers, setFollowers] = useState<FollowInfo[]>([]);
    const [following, setFollowing] = useState<FollowInfo[]>([]);
    const navigate = useNavigate();
    const { handleCreateRoom } = useCreateChatRoom();


    useEffect(() => {
        if (!user) return;

        const fetchUserDetails = async (userIds: string[]) => {
            const userDetails: FollowInfo[] = [];
            for (const userId of userIds) {
                const userDoc = await getDoc(doc(db, 'Users', userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userDetails.push({
                        id: userId,
                        displayName: userData.displayName || '',
                        email: userData.email || '',
                        photoURL: userData.photoURL || ''
                    });
                }
            }
            return userDetails;
        };

        const fetchFollowData = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'Users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const followingList = userData.following || [];
                    const followersList = userData.followers || [];
                    const followingDetails = await fetchUserDetails(followingList);
                    const followersDetails = await fetchUserDetails(followersList);

                    setFollowing(followingDetails);
                    setFollowers(followersDetails);
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFollowData();
    }, [user]);

    const TabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
        const tab = newValue === 0 ? 'followers' : 'following';
        navigate(`?tab=${tab}`, { replace: true });
    };

    // 팔로잉 삭제: 나의 팔로잉 목록과 상대방의 팔로워 목록에서 제거
    const handleUnfollow = async (userId: string) => {
        if (!user) return;

        const userRef = doc(db, 'Users', user.uid);
        const targetRef = doc(db, 'Users', userId);

        await updateDoc(userRef, {
            following: arrayRemove(userId)
        });

        await updateDoc(targetRef, {
            followers: arrayRemove(user.uid)
        });

        setFollowing(prev => prev.filter(f => f.id !== userId));
        setFollowers(prev => prev.filter(f => f.id !== userId));
    };

    // 팔로워 삭제: 상대방의 팔로워 목록과 나의 팔로워 목록에서 제거
    const handleRemoveFollower = async (followerId: string) => {
        if (!user) return;

        const myRef = doc(db, 'Users', user.uid); // 나의 정보
        const targetRef = doc(db, 'Users', followerId); // 팔로워의 정보

        // 나의 팔로워 목록에서 상대방 제거
        await updateDoc(myRef, {
            followers: arrayRemove(followerId)
        });

        // 상대방의 팔로잉 목록에서 나를 제거
        await updateDoc(targetRef, {
            following: arrayRemove(user.uid)
        });

        setFollowers(prev => prev.filter(f => f.id !== followerId));
        setFollowing(prev => prev.filter(f => f.id !== followerId));
    };

    return (
        <div>
            <AppBarHeader title={user?.displayName || 'FollowList'} showBackButton={true} />
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
                                    <li key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="circular" width={50} height={50} />
                                        <div style={{ flex: 1 }}>
                                            <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width="60%" />
                                            <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width="40%" />
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
                                            <Link
                                                to={`/user/${follower.id}`}
                                                onClick={(e) => {
                                                    if (user?.uid === follower.id) {
                                                        e.preventDefault();
                                                        navigate(`/Profile`);
                                                    }
                                                }}
                                            >
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
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                className='PostList_following'
                                                onClick={() => handleCreateRoom(follower.id)} // 메시지 보내기
                                            >
                                                메시지
                                            </button>
                                            <button
                                            className='PostList_following'
                                                onClick={() => handleRemoveFollower(follower.id)}
                                            >
                                                팔로워 삭제
                                            </button>
                                            </div>
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
                                            <Link
                                                to={`/user/${followingUser.id}`}
                                            >
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
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                className='PostList_following'
                                                onClick={() => handleCreateRoom(followingUser.id)} // 메시지 보내기
                                            >
                                                메시지
                                            </button>
                                            <button
                                                className='PostList_following'
                                                onClick={() => handleUnfollow(followingUser.id)}
                                            >
                                                언팔로우
                                            </button>
                                            </div>
                                        </li>
                                    )) : (
                                        <p className="noPostlist">팔로잉이 없습니다.</p>
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
