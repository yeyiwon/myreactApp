import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Avatar, IconButton, Tabs, Tab } from "@mui/material";
import { collection, getDocs, doc, query, orderBy, arrayRemove, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import AuthContext from 'Context/AuthContext';
import ThemeContext from '../../Context/ThemeContext';
import { MdFavoriteBorder } from "react-icons/md";
import { MdFavorite } from "react-icons/md";
import Skeleton from '@mui/material/Skeleton';
// import FollowingBox from './following/FollowingBox';
import { PostProps, PostWithAuthor } from 'types/InterfaceTypes';
import { formatDate } from '../Util/dateUtil';


export default function PostList() {
    const [posts, setPosts] = useState<PostWithAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const [tab, setTab] = useState<'following' | 'all'>('following');

    const TabChange = (event: React.SyntheticEvent, newValue: 'following' | 'all') => {
        setTab(newValue);
    };

const getPosts = async () => {
        setLoading(true);
        try {
            const following = user ? await getUserFollowing(user.uid) : [];
            const postsRef = collection(db, "Posts");
            const postsQuery = query(postsRef, orderBy('createAt', "desc"));
            const querySnapshot = await getDocs(postsQuery);

            const fetchedPosts: PostWithAuthor[] = [];
            const authorCache: { [key: string]: any } = {};

            for (const docSnap of querySnapshot.docs) {
                const postData = docSnap.data() as PostProps;
                const authorId = postData?.uid;

                if (!authorCache[authorId]) {
                    const authorRef = doc(db, 'Users', authorId);
                    const authorSnap = await getDoc(authorRef);
                    authorCache[authorId] = authorSnap.data();
                }

                const authorData = authorCache[authorId];

                if (tab === 'following' && (user?.uid === authorId || following.includes(authorId))) {
                    fetchedPosts.push({
                        ...postData,
                        id: docSnap.id,
                        authorDisplayName: authorData?.displayName,
                        authorProfileUrl: authorData?.photoURL,
                    });
                } else if (tab === 'all') {
                    fetchedPosts.push({
                        ...postData,
                        id: docSnap.id,
                        authorDisplayName: authorData?.displayName,
                        authorProfileUrl: authorData?.photoURL,
                    });
                }
            }

            setPosts(fetchedPosts);
        } catch (error) {
            console.error("포스트 오류:", error);
        } finally {
            setLoading(false);
        }
    };

    const getUserFollowing = async (uid: string) => {
        try {
            const userRef = doc(db, 'Users', uid);
            const userSnap = await getDoc(userRef);
            return userSnap.data()?.following || [];
        } catch (error) {
            console.error("팔로잉 목록 오류:", error);
            return [];
        }
    };

    useEffect(() => {
        getPosts();
    }, [tab]);

    return (
        <div className='postContainer' style={{ paddingBottom: '64px' }}>
            <div>
                <Tabs 
                    sx={{
                        justifyContent: 'center',
                        width: '100%',
                        '& .MuiTabs-indicator': {
                            backgroundColor: 'transparent'
                        },
                        
                    }}
                value={tab} onChange={TabChange}>
                    <Tab label="팔로잉" value="following" 
                    sx={{  '&.Mui-selected': {
                            fontWeight: 'bold',
                            background: theme === 'light' ? '#F7F7F7' : '#3D3A50',

                            color: theme === 'light' ? '#580Ef6' : '#F7F7F7'
                        },
                        textAlign: 'center',
                        color: theme === 'light' ? '#1A1C22' : '#F7F7F7', }}
                    
                    />
                    <Tab label="전체 글" value="all" 
                        sx={{'&.Mui-selected': {
                            fontWeight: 'bold',
                            background: theme === 'light' ? '#F7F7F7' : '#3D3A50',

                            color: theme === 'light' ? '#580Ef6' : '#F7F7F7'
                        },
                        textAlign: 'center',
                        color: theme === 'light' ? '#1A1C22' : '#F7F7F7', }}
                    
                    
                    />
                </Tabs>
            </div>
            <ul className="post_list">
                {loading ? (

                    Array.from({ length: 3 }).map((_, index) => (
                        <li key={index}>
                            
                            <div className='AuthorArea'>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="circular" width={40} height={40} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={60} height={15} />
                                    <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="text" width={100} height={15} />
                                </div>    
                                </div>
                            </div>
                            <Skeleton sx={{ background: theme === 'light' ? '' : '#888' }} variant="rectangular" width="100%" height={300} />
                        </li>
                    ))
                ) : posts.length > 0 ? posts.map(post => (
                    <li key={post.id}>
                        <div className='AuthorArea'>
                        <Link 
                            to={user?.uid === post?.uid ? `/Profile` : `/user/${post?.uid}`}
                            onClick={(e) => {
                                if (user?.uid === post?.uid) {
                                    e.preventDefault();
                                    navigate(`/Profile`);
                                }
                            }}
                        >


                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Avatar
                                    src={post?.authorProfileUrl || ''}
                                    alt="Profile"
                                    sx={{
                                        width: '40px', height: '40px', objectFit: 'cover'
                                    }}
                                />
                                <div style={{ display: 'flex', flexDirection: "column" }}>
                                    <p className='AuthorArea_Author'>
                                        {post.authorDisplayName}
                                    </p>
                                    <p className='AuthorArea_Date'>
                                        {formatDate(post.createAt)}
                                    </p>
                                </div>
                            </div>
                        </Link>
                        </div>
                        <Link to={`/Posts/${post?.id}`}>
                            <div className="post_box" style={{ backgroundColor: post.backgroundColor || '#ffffff' }}>
                                <div className='PostImageContainer' style={{ height: '100%', width: '100%' }}>
                                    {post?.imageUrl ? (
                                        <img src={post.imageUrl} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : null}
                                </div>
                            </div>
                        </Link>
                        <div className='postList_textBox'>
                            <h3 className="PostcontextBoxTitle"> {post?.title} </h3>
                            {/* <IconButton 
                                sx={{ display: 'flex', gap: '5px' }}         
                                onClick={() => ToggleLike(post)}
                            >
                                {user && post?.likes?.includes(user.uid) ? (
                                    <MdFavorite color='red' size={22} />
                                ) : (
                                    <MdFavoriteBorder color='#fff' size={22} />
                                )}
                            </IconButton> */}
                        </div>
                    </li>
                )) : (
                    <p className='noPostlist'>
                        게시글이 없습니다
                    </p>
                )}
            </ul>
        </div>
    );
}
