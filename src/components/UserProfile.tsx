import React, { useEffect, useState, useContext } from 'react';
import { Avatar, Button } from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, where, doc, updateDoc, arrayRemove, arrayUnion, addDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import ThemeContext from '../Context/ThemeContext';
import AppBarHeader from './LayOut/Header';
import { PostProps, UserProps } from 'types/InterfaceTypes';
import AuthContext from 'Context/AuthContext';
import AppBottomNav from 'components/LayOut/BottomNavigation';
import { useCreateChatRoom } from './Chat/useCreateChatRoom';


export default function UserProfile() {
    const { theme } = useContext(ThemeContext);
    const { id } = useParams<{ id: string }>();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostProps[]>([]);
    const [profileUser, setProfileUser] = useState<UserProps | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const { CreateRoom } = useCreateChatRoom();

    const SendMessage = () => {
        if (id) {
            CreateRoom(id);
        }
    };
    useEffect(() => {
        if (id) {
            const userRef = doc(db, 'Users', id);

            const filterUser = onSnapshot(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    setProfileUser(snapshot.data() as UserProps);
                } else {
                    setProfileUser(null);
                }
            });

            const postsRef = collection(db, "Posts");
            const postsQuery = query(
                postsRef,
                where('uid', '==', id),
                orderBy('createAt', "desc")
            );

            const filterPosts = onSnapshot(postsQuery, (snapshot) => {
                const postsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PostProps[];
                setPosts(postsData);
            });

            return () => {
                filterUser();
                filterPosts();
            };
        }
    }, [id]);

    useEffect(() => {
        if (user?.uid && id) {
            const userDocRef = doc(db, 'Users', user.uid);

            const CheckFollowing = onSnapshot(userDocRef, (snapshot) => {
                const userData = snapshot.data();
                setIsFollowing(userData?.following?.includes(id));
            });

            return () => CheckFollowing(); 
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
                }
                setIsFollowing(!isFollowing);
            } catch (error) {
                console.error('에러', error);
            }
        }
    };

    const TabClick = (tab: string) => {
        navigate(`/userFollowingList/${id}?tab=${tab}`);
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
                            <div className='follower_links_btn' onClick={() => TabClick('followers')}>
                                팔로워 {profileUser?.followers?.length || 0}
                            </div>
                            <div className='follower_links_btn' onClick={() => TabClick('following')}>
                                팔로잉 {profileUser?.following?.length || 0}
                            </div>
                        </div>
                        <div className='btnBox'>
                            <button 
                                className={isFollowing ? 'Profile_following' : 'Profile_follow'} 
                                onClick={FollowToggle}
                            >
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                            <button className='Profile_msgBtn' onClick={SendMessage}>
                                메세지
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="ProfileMypostContainer">
                    <h3 className='ProfiePost_list_title' style={{ position: 'sticky', top: '56px', left: 0, zIndex: 10 }}> Post </h3>
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
