import React, { useEffect, useState } from 'react';
import { Avatar, Button } from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, where, doc, getDoc, updateDoc, arrayRemove, arrayUnion, addDoc, setDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import ThemeContext from './ThemeContext';
import { useContext } from 'react';
import AppBarHeader from './Header';
import { PostProps } from 'types/postTypes';
import AuthContext from 'Context/AuthContext';
import AppBottomNav from 'components/BottomNavigation';

export default function UserProfile() {
    const { theme } = useContext(ThemeContext);
    const { id } = useParams<{ id: string }>();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostProps[]>([]);
    const [profileUser, setProfileUser] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);

    useEffect(() => {
        if (id) {
            const userRef = doc(db, 'Users', id);
            getDoc(userRef).then((snapshot) => {
                const data = snapshot.data();
                setProfileUser(data);
            });

            const postsRef = collection(db, "Posts");
            const postsQuery = query(
                postsRef,
                where('uid', '==', id),
                orderBy('createAt', "desc")
            );

            const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
                const postsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PostProps[];
                setPosts(postsData);
            });

            return () => unsubscribe();
        }
    }, [id]);

    useEffect(() => {
        if (user?.uid && id) {
            const userDocRef = doc(db, 'Users', user.uid);
            getDoc(userDocRef).then((userSnap) => {
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setIsFollowing(userData?.following?.includes(id));
                }
            });
        }
    }, [user, id]);

    const FollowToggle = async () => {
        if (user?.uid && id) {
            const userDocRef = doc(db, 'Users', user.uid);
            const profileUserDocRef = doc(db, 'Users', id);

            try {
                if (isFollowing) {
                    // 팔로잉 취소
                    await updateDoc(userDocRef, {
                        following: arrayRemove(id),
                    });
                    await updateDoc(profileUserDocRef, {
                        followers: arrayRemove(user.uid),
                    });

                    // 프로필 유저의 팔로워 수 업데이트
                    setProfileUser((prev: any) => ({
                        ...prev,
                        followers: prev.followers?.filter((followerId: string) => followerId !== user.uid),
                    }));
                } else {
                    // 팔로우
                    await updateDoc(userDocRef, {
                        following: arrayUnion(id),
                    });
                    await updateDoc(profileUserDocRef, {
                        followers: arrayUnion(user.uid),
                    });

                    // 팔로워 추가 및 알림 추가
                    await addDoc(collection(db, 'Notification'), {
                        uid: id,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        url: `/user/${user.uid}`,
                        content: '님이 회원님을 팔로우하기 시작했습니다.',
                        authorUid: user?.uid,
                    });

                    // 프로필 유저의 팔로워 수 업데이트
                    setProfileUser((prev: any) => ({
                        ...prev,
                        followers: [...(prev.followers || []), user.uid],
                    }));
                }
                setIsFollowing(!isFollowing);
            } catch (error) {
                console.error('Error updating follow status: ', error);
            }
        }
    };

    const createChatRoom = async (userUid: string, profileUserUid: string): Promise<string> => {
        try {
            if (!userUid || !profileUserUid) {
                throw new Error('User IDs are required.');
            }

            const chatRoomId = `${userUid}_${profileUserUid}`;
            const chatRoomRef = doc(db, 'chatRooms', chatRoomId);

            // 채팅방이 이미 존재하는지 확인
            const docSnap = await getDoc(chatRoomRef);
            if (docSnap.exists()) {
                console.log('Chat room already exists.');
                return chatRoomId;
            }

            // 새로운 채팅방 생성
            await setDoc(chatRoomRef, {
                users: [userUid, profileUserUid],
            });

            console.log('Chat room created successfully.');
            return chatRoomId;
        } catch (error) {
            console.error('Error creating chat room: ', error);
            throw error;
        }
    };

const handleMessageClick = async () => {
    if (!profileUser?.uid || !user?.uid) {
        console.error('User information is missing.');
        console.log('profileUser:', profileUser);
        console.log('user:', user);
        return;
    }
    try {
        const chatRoomId = await createChatRoom(user.uid, profileUser.uid);
        navigate(`/chat/${chatRoomId}`); // 채팅방 ID를 포함하여 리디렉션
    } catch (error) {
        console.error('Error handling message click: ', error);
    }
};

    const TabClick = (tab: string) => {
        navigate(`/FollowingList/${id}?tab=${tab}`);
    };

    return (
        <>
            <AppBarHeader title={profileUser?.displayName} showBackButton={true} />
            <div className='profile_components'>
                <div className='Profile_section'>
                    <Avatar
                        src={profileUser?.photoURL || ''}
                        alt="Profile"
                        sx={{
                            width: '150px', height: '150px', objectFit: 'cover', boxShadow: 3
                        }}
                    />
                    <div className='profile_area'>
                        <p className='profile_name'>
                            {profileUser?.displayName}
                        </p>
                        <div className='profile_email'>
                            {profileUser?.email}
                        </div>
                        <div className='posting_followerBox'>
                            <span className='PostLength'>게시물 {posts.length}</span>
                            <button className='follower_links_btn' onClick={() => TabClick('followers')}>
                                팔로워 {profileUser?.followers?.length || 0}
                            </button>
                            <button className='follower_links_btn' onClick={() => TabClick('following')}>
                                팔로잉 {profileUser?.following?.length || 0}
                            </button>
                        </div>
                        <div className='btnBox'>
                            <button 
                                className={isFollowing ? 'Profile_following' : 'Profile_follow'} 
                                onClick={FollowToggle}
                            >
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                            <button className='Profile_msgBtn' onClick={handleMessageClick}>
                                메세지
                            </button>
                        </div>
                    </div>
                </div>
                <div className="ProfileMypostContainer">
                    <h3 className='ProfiePost_list_title'> Post </h3>
                    <ul className='ProfiePost_list'>
                        {posts.length > 0 ? posts.map(post => (
                            <Link key={post.id} to={`/Posts/${post?.id}`}>
                                <li className="Profile_post_box">
                                    <h3 className='Profile_post_box_title'>{post.title}</h3>
                                    <div className="Profile_post_image" style={{ 
                                        width: '100%', height: '100%',
                                        backgroundColor: post.backgroundColor || '#ffffff' 
                                    }}>
                                        {post?.imageUrl ? (
                                            <img src={post.imageUrl} alt="Post" />
                                        ) : null}
                                    </div>
                                </li>
                            </Link>
                        )) : (
                            <p style={{ textAlign: 'center' }}> 게시물이 없습니다.</p>
                        )}
                    </ul>
                </div>
            </div>
            <AppBottomNav />
        </>
    );
}
