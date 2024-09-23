import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Tabs, Tab, Button, Skeleton } from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { arrayRemove, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import ThemeContext from '../../Context/ThemeContext';
import AuthContext from 'Context/AuthContext';
import AppBarHeader from '../LayOut/Header';
import { FollowInfo, UserProps } from 'types/InterfaceTypes';
import { useCreateChatRoom } from '../Chat/useCreateChatRoom';


export default function MyFollowingList() {
    const { theme } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);

    const [tabIndex, setTabIndex] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [followers, setFollowers] = useState<FollowInfo[]>([]);
    const [following, setFollowing] = useState<FollowInfo[]>([]);
    const navigate = useNavigate();
    const { CreateRoom } = useCreateChatRoom();
    const [userInfo, setUserInfo] = useState<UserProps | null>(null);

// -- 코드 흐름 --
        // 현재 로그인 된 사용자가 있는지 확인 
        // 확인하고 문서가 있는지 확인 
        // 문서가 있으면 UserProps 타입으로 유저 정보 useState에 반영
        // 불러온 유저정보에서 팔로워 팔로잉의 데이터를 가져올 건데 
        // 우선 팔로잉의 아이디 값을 가지고 팔로잉 팔로워의 정보를 또 가져오는 일을 해야돼 
        // 그래서 잠깐 await getUserData()야 기다리고있어바 userSnap.data().followers || [] 데이터 좀 가져올게

        // getUserData = async (id: string[]) => {현재 로그인된 사용자의 팔로잉 데이터에서 가져온 사용자 ID 배열을 가지고 
        // Pwomise.all(id.map()) 매핑할거야
        // Promise.all 인 이유는 Users 컬렉션 안에 팔로잉 팔로워 배열이 있음 
        // 이게 아이디로만 저장을 해둠 
        // 이렇게 안 하면 사용자의 프사가 바꼈을 때 바뀐 값을 가져오지 못함 
        // 아이디를 가지고 아이디의 정보를 또 가져와야하는데 
        // 아이디를 가져올 돋안 뱌열의 정보를 도는 것이기 때문에 ! 
        // Promise.all(id.map())으로 매핑 된 거 가지고! 프로미스 올 하는동안 
        // 그 해당 아이디의 유저의! 정보를! followInfo 타입으로 가져온다는거임

        // 다 돌고 가져왔으면 
        // followerData 얘가 await getUserData 잘 기다리고 있던 애가 
        // setFollowers 라는 상태에 저장을 하고 UI 에 출력
        // 다 불러와지면 setLoading(false); 을 falae로 처리하고 

        // 얘는 실시간 onSnapshot 하던애라서 useEffect로 유저 아이디가 있을 때만 하는일인 건데 
        // 굳이 할 일 없으면 그냥 자고이썽야 메모리 관리에 좋으니까 걍 자 
        // return () => {
                // getUserSnap();
            // };

        // 팔로잉 리스트 가져온걸로 ui 에 출력 시키고 언팔 팔로워 삭제 기능을 할 때 onClick 사용하면서 
        // 인자로 받고 그 인자 받은 걸로 기능 하는거 

    //};

    useEffect(() => {

    if (!user) {
        return; 
        }
        const userRef = doc(db, 'Users', user.uid);
        const getUserSnap = onSnapshot(userRef, async (userSnap) => {
            if (userSnap.exists()) {
                setUserInfo(userSnap.data() as UserProps);
                
                const followerData = await getUserData(userSnap.data().followers || []);
                console.log(followerData);
                
                setFollowers(followerData as FollowInfo[]);

                const followingData = await getUserData(userSnap.data().following || []);
                console.log(followingData)
                setFollowing(followingData as FollowInfo[]);
            }
            setLoading(false);
        });

        return () => {
            getUserSnap();
        };

    }, [user]);

    const getUserData = async (id: string[]) => {
        
        return await Promise.all(id.map(async (id) => {
            const userDoc = await getDoc(doc(db, "Users", id));
            // 여기서 아이디는 팔로잉 리스트 안에 있는 팔로잉 유저의 아이디인 거임 
            if (userDoc.exists()) {
                // 데이터가 있다면 FollowInfo 타입으로 받아ㅓ 
            const data = userDoc.data() as FollowInfo;
            // 반환
            return { ...data, id };
        }
            return null;
        }));
    }

    const removeFollower = async (followerId: string) => {
        if (!user) return; 
        // 팔로워 아이디 가져다가
            const userRef = doc(db, 'Users', user.uid);
            // 현재 로그인 된 유저 아이디랑 팔로워 아이디 가져오고 
            const followerRef = doc(db, 'Users', followerId);

            await updateDoc(userRef, {
                followers: arrayRemove(followerId)
            });

            await updateDoc(followerRef, {
                following: arrayRemove(user.uid)
            });

            setFollowers(followers.filter(follower => follower.id !== followerId));
            // 필터의 기능 활용 = 주로 삭제할 때 가장 중요한 
            // 배열을 돌면서 어진 조건이 참인 요소들만으로 새로운 배열을 만드는 기능 
            // followerId 와 일치하지 않는 애들만 남겨놓고 상태업뎃
            
    };

    const unfollow = async (followingUserId: string) => {
        if (!user) return;

        const userRef = doc(db, 'Users', user.uid);
        const followingUserRef = doc(db, 'Users', followingUserId);

            await updateDoc(userRef, {
                following: arrayRemove(followingUserId)
            });

            await updateDoc(followingUserRef, {
                followers: arrayRemove(user.uid)
            });

            setFollowing(following.filter(following => following.id !== followingUserId));
    };

    const TabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
        const tab = newValue === 0 ? 'followers' : 'following';
        navigate(`?tab=${tab}`, { replace: true });
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
                                    <li key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', padding: '1em' }}>
                                        <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="circular" width={50} height={50} />
                                        <div style={{ flex: 1 }}>
                                            <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={100} />
                                            <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={150} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={60} height={50} />
                                            <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={60} height={50} />
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
                                                onClick={() => CreateRoom(follower.id)} 
                                            >
                                                메시지
                                            </button>
                                            <button className='PostList_following' onClick={() => removeFollower(follower.id)}>팔로워 삭제</button>

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
                                                onClick={() => CreateRoom(followingUser.id)} 
                                            >
                                                메시지
                                            </button>
                                            <button className='PostList_following' onClick={() => unfollow(followingUser.id)}>언팔로우</button>

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