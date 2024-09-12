import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Tabs, Tab, Button, Skeleton } from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import ThemeContext from './ThemeContext';
import AuthContext from 'Context/AuthContext';
import AppBarHeader from './Header';

interface FollowInfo {
    id: string;
    displayName: string;
    photoURL: string;
    email: string;
}

export default function FollowingList() {
    const { id } = useParams<{ id: string }>();
    const { theme } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);
    const [tabIndex, setTabIndex] = useState<number>(1);
    const [following, setFollowing] = useState<FollowInfo[]>([]);
    const [followers, setFollowers] = useState<FollowInfo[]>([]);
    const [profileUser, setProfileUser] = useState<FollowInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // 로딩 상태 추가
    const navigate = useNavigate();

    // 탭 인덱스 설정
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        setTabIndex(tab === 'followers' ? 0 : 1);
    }, []);

useEffect(() => {
    if (id) {
        const userDocRef = doc(db, 'Users', id);

        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setProfileUser(userData as FollowInfo);
                const followingIds = userData?.following || [];
                const followersIds = userData?.followers || [];

            const fetchFollowingDetails = async (ids: string[]) => {
                const followInfoPromises = ids.map(async (followId) => {
                    if (!followId) return null; // followId가 정의되어 있는지 확인

                    const followDocRef = doc(db, 'Users', followId);
                    const followSnap = await getDoc(followDocRef);
                    return followSnap.exists() ? (followSnap.data() as FollowInfo) : null;
                });

                const followInfoArray = await Promise.all(followInfoPromises);
                return followInfoArray.filter((info) => info !== null) as FollowInfo[];
            };


                // 팔로잉 및 팔로워 상세 정보 불러오기
                Promise.all([
                    fetchFollowingDetails(followingIds),
                    fetchFollowingDetails(followersIds),
                ]).then(([followingData, followersData]) => {
                    setFollowing(followingData);
                    setFollowers(followersData);
                    setLoading(false);
                });
            }
        });

        return () => unsubscribe(); // 컴포넌트 언마운트 시 리스너 해제
    }
}, [id]);


    const TabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
        const tab = newValue === 0 ? 'followers' : 'following';
        navigate(`?tab=${tab}`, { replace: true });
    };

const handleRemoveFollower = async (targetId: string) => {
    if (!user) return;

    const userDocRef = doc(db, 'Users', user.uid);
    const targetUserDocRef = doc(db, 'Users', targetId);

    try {
        // 현재 사용자의 팔로워 목록에서 타겟 사용자 삭제
        const updatedFollowers = followers.filter(follower => follower.id !== targetId);
        await updateDoc(userDocRef, { followers: updatedFollowers });

        // 타겟 사용자의 팔로잉 목록에서 현재 사용자 삭제
        const targetUserSnap = await getDoc(targetUserDocRef);
        if (targetUserSnap.exists()) {
            const targetUserData = targetUserSnap.data() as { following: string[] };
            const updatedFollowing = targetUserData.following.filter(followingUser => followingUser !== user.uid);
            await updateDoc(targetUserDocRef, { following: updatedFollowing });
        }

        // 상태 업데이트
        setFollowers(updatedFollowers);
    } catch (error) {
        console.error('Error removing follower: ', error);
    }
};

const handleUnfollow = async (targetId: string) => {
    if (!user || !targetId) return; // targetId가 정의되어 있는지 확인

    const userDocRef = doc(db, 'Users', user.uid);
    const targetUserDocRef = doc(db, 'Users', targetId);

    try {
        // 현재 사용자의 팔로잉 목록에서 타겟 사용자 삭제
        const updatedFollowing = following.filter(followingUser => followingUser.id !== targetId);
        await updateDoc(userDocRef, { following: updatedFollowing });

        // 타겟 사용자의 팔로워 목록에서 현재 사용자 제거
        const targetUserSnap = await getDoc(targetUserDocRef);
        if (targetUserSnap.exists()) {
            const targetUserData = targetUserSnap.data() as { followers: string[] };
            const updatedFollowers = targetUserData.followers.filter(follower => follower !== user.uid);
            await updateDoc(targetUserDocRef, { followers: updatedFollowers });
        }

        // 상태 업데이트
        setFollowing(updatedFollowing);
    } catch (error) {
        console.error('Error unfollowing user: ', error);
    }
};


    return (
        <div>
            <AppBarHeader
                title={profileUser?.displayName || 'User Profile'}
                showBackButton={true}
            />
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
                                {[...Array(10)].map((_, index) => (
                                    <li key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Skeleton variant="circular" width={50} height={50} />
                                        <div style={{ flex: 1 }}>
                                            <Skeleton variant="text" width="60%" />
                                            <Skeleton variant="text" width="40%" />
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
                                        <li key={follower.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Link
                                                to={`/user/${follower.id}`}
                                                onClick={(e) => {
                                                    if (user?.uid === follower.id) {
                                                        e.preventDefault();
                                                        navigate(`/Profile`);
                                                    }
                                                }}
                                            >
                                                <div className='usebox'>
                                                    <Avatar
                                                        src={follower.photoURL || ''}
                                                        alt={follower.displayName || 'User'}
                                                        sx={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                    />
                                                    <div>
                                                        <span className="Comment_Author">{follower.displayName}</span>
                                                        <span className="Comment_Text">{follower.email}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                            {user?.uid === id && (
                                                <button
                                                    onClick={() => handleRemoveFollower(follower.id)}
                                                    className='PostList_following'
                                                >
                                                    삭제
                                                </button>
                                            )}

                                        </li>
                                    )) : (
                                        <p className="noPostlist">팔로워가 없습니다.</p>
                                    )}
                                </ul>
                            )}
                            {tabIndex === 1 && (
                                <ul className='SearchArea'>
                                    {following.length > 0 ? following.map(followedUser => (
                                        <li key={followedUser.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Link
                                                to={`/user/${followedUser.id}`}
                                                onClick={(e) => {
                                                    if (user?.uid === followedUser.id) {
                                                        e.preventDefault();
                                                        navigate(`/Profile`);
                                                    }
                                                }}
                                            >
                                                <div className='usebox'>
                                                    <Avatar
                                                        src={followedUser.photoURL || ''}
                                                        alt={followedUser.displayName || 'User'}
                                                        sx={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                    />
                                                    <div className='userEmailName'>
                                                        <span className="Comment_Author">{followedUser.displayName}</span>
                                                        <p className="Comment_Text">{followedUser.email}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        {user?.uid === id && (
                                            <button
                                                onClick={() => handleUnfollow(followedUser.id)}
                                                className='PostList_following'
                                            >
                                                언팔로우
                                            </button>
                                        )}

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