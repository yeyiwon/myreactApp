import React, { useContext, useEffect, useState } from 'react';
import { Avatar, IconButton, Tooltip, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { getAuth, signOut } from 'firebase/auth';
import { app, db } from 'firebaseApp';
import ThemeContext from './ThemeContext';
import { BiDoorOpen } from "react-icons/bi";
import { Link, useNavigate } from 'react-router-dom';
import { SuccessToast, ErrorToast } from './toastConfig';
import AuthContext from 'Context/AuthContext';
import { PostProps } from 'types/postTypes';
import AppBottomNav from 'components/BottomNavigation';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import ConfirmDialog from './ConfirmDialog';

export default function ProfilePage() {
    const { theme } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostProps[]>([]);
    const [followingCount, setFollowingCount] = useState<number>(0);
    const [followersCount, setFollowersCount] = useState<number>(0);
    const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

    const iconColor = theme === 'light' ? '#3D3A50' : '#F7F7F7';

    useEffect(() => {
        if (user) {
            // Posts 가져오기
            const postsRef = collection(db, "Posts");
            const postsQuery = query(
                postsRef,
                where('uid', '==', user.uid),
                orderBy('createAt', "desc")
            );

            const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
                const postsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PostProps[];
                setPosts(postsData);
            });

            // 팔로잉 목록 가져오기
            const userRef = doc(db, 'Users', user.uid);
            const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
                const userData = docSnap.data();
                if (userData) {
                    setFollowingCount(userData.following?.length || 0);
                    setFollowersCount(userData.followers?.length || 0);
                }
            });

            return () => {
                unsubscribePosts();
                unsubscribeUser();
            };
        }
    }, [user]);

    const handleClickOpen = () => setOpenLogoutDialog(true);
    const handleClose = () => setOpenLogoutDialog(false);

    const handleLogout = async () => {
        try {
            await signOut(getAuth(app)); // 로그아웃 처리
            SuccessToast('로그아웃 완료', theme);
            navigate('/login'); // 로그아웃 후 로그인 페이지로 이동
        } catch (error) {
            ErrorToast('로그아웃 중 오류 발생', theme);
        }
        handleClose();
    };

    const TabClick = (tab: string) => {
        navigate(`/FollowingList/${user?.uid}?tab=${tab}`);
    };

    return (
        <div className='profile_components'>
            <div className='Profile_section'>
                <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                    <Tooltip title="로그아웃">
                            <IconButton
                            sx={{ 
                                color: iconColor, 
                                fontWeight: 'bold', 
                                padding: 0 
                            }}
                            onClick={handleClickOpen}  // 모달 열기
                            >
                            <BiDoorOpen size={30} />
                            </IconButton>
                        </Tooltip>

                         <ConfirmDialog
                        open={openLogoutDialog}
                        content="로그아웃 하시겠습니까?"
                        onConfirm={handleLogout}
                        onCancel={handleClose}
                    />
                </div>
                <Avatar
                    src={user?.photoURL || ''}
                    alt="Profile"
                    sx={{ width: '120px', height: '120px', objectFit: 'cover', boxShadow: 3 }}
                />
                <div className='profile_area'>
                    <p className='profile_name'>{user?.displayName || '사용자'}</p>
                    <div className='profile_email'>{user?.email}</div>
                </div>
                <div className='posting_followerBox'>
                    <span className='PostLength'>게시물 {posts.length}</span>
                    <button className='follower_links_btn'
                        onClick={() => TabClick('followers')}
                    >
                        팔로워 {followersCount}
                    </button>
                    <button className='follower_links_btn'
                        onClick={() => TabClick('following')}
                    >
                        팔로잉 {followingCount}
                    </button>
                </div>
                <div>
                    <button className='Profile_msgBtn'
                        onClick={() => navigate('/Profile/edit')}
                    > 
                        프로필 수정 
                    </button>
                </div>
            </div>
            <div className="ProfileMypostContainer">
                <h3 className='ProfiePost_list_title'> Post </h3>
                
                <ul className='ProfiePost_list'>
                    {posts.length > 0 ? posts.map(post => (
                    <Link to={`/Posts/${post?.id}`} key={post.id}>
                        <li className="Profile_post_box">
                            <h3 className='Profile_post_box_title'>{post.title}</h3>
                            <div className="Profile_post_image" style={{ 
                                width: '100%', height: '100%',
                                backgroundColor: post.backgroundColor || '#ffffff' }}>
                                {post?.imageUrl ? (
                                    <img src={post.imageUrl} alt="Post" />
                                ) : (
                                    null
                                )}
                            </div>
                        </li>
                        </Link>
                    )) : (
                        <p className="NoNotifications"> 게시물이 없습니다. </p>
                    )}
                </ul>
            </div>
            <AppBottomNav />


            {/* <Dialog open={openDialog} onClose={handleClose} PaperProps={{
                style: {
                    padding: '0.5em',
                    borderRadius: 8,
                    boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.1)',
                },
            }}>
                <DialogContent sx={{ textAlign: 'center', fontSize: '16px' }}>
                    <p>로그아웃 하시겠습니까?</p>
                </DialogContent>
                <DialogActions sx={{ display: 'flex',
                    justifyContent:'center',}}>
                    <Button 
                        onClick={handleClose} 
                        fullWidth
                        sx={{ 
                            color: '#333', 
                            backgroundColor: '#eee', 
                            // borderRadius: 5, 
                            '&:hover': { backgroundColor: '#ddd' }
                        }}
                    >
                        취소
                    </Button>
                    <Button 
                        fullWidth
                        onClick={handleSignOut} 
                        sx={{ 
                            color: '#f7f7f7', 
                            backgroundColor: '#580EF6', 
                            // borderRadius: 5, 
                            '&:hover': { backgroundColor: '#4d0dc6' }
                        }}
                    >
                        로그아웃
                    </Button>
                </DialogActions>
            </Dialog> */}
        </div>
    );
}
