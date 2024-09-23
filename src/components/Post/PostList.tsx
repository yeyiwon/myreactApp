import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Avatar, IconButton, Tabs, Tab } from "@mui/material";
import { collection, getDocs, doc, query, orderBy, arrayRemove, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import AuthContext from 'Context/AuthContext';
import ThemeContext from '../../Context/ThemeContext';
import Skeleton from '@mui/material/Skeleton';

import { PostProps } from 'types/InterfaceTypes';
import { formatDate } from '../Util/dateUtil';


// -- 코드 흐름 -- 
// 현재 로그인 한 사용자가 팔로잉 하는 유저 불러오고 
// 유저가 id 값으로 팔로잉하는 유저를 저장하고있기 때문에 
// 팔로잉하는 유저가 쓴 글 / 그 유저의 정보 등을 또 불러오는 절차가 필요하기 때문에 
// promise.all 로 기다리면서 팔로잉하는 유저가 쓴 글 / 그 유저의 정보 이런 걸 매핑하면서 가져온다
// 가져오고 출력

export default function PostList() {
    const [posts, setPosts] = useState<PostProps[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const [tab, setTab] = useState<'following' | 'all'>('following');

    const TabChange = (event: React.SyntheticEvent, newValue: 'following' | 'all') => {
        setTab(newValue);
    };

    const getUserFollowing = async () => {
        if(user){
            const userRef = doc(db, 'Users', user?.uid);
            const userSnap = await getDoc(userRef);
            return userSnap.data()?.following || [];
        }
    };

    useEffect(() => {
        getPosts();
    }, [tab]);

    const getPosts = async () => {
    setLoading(true);
    if (user) { 
        const following = await getUserFollowing();
        const postsRef = collection(db, "Posts");
        // 전체 포스트 불러오기
        const postsQuery = query(postsRef, orderBy('createAt', "desc"));
        // 전체 포스트를 내림차순으로 정렬하기
        const querySnapshot = await getDocs(postsQuery);
        
        // 겟포스트 할 때 포스트 프롭 타입을 우선 빈 배여로 해놓고 여기에 담겨질 동안 기다렸려 
        const getPosts: PostProps[] = await Promise.all(
                // 밑에서 매핑할 때까지 좀 기다렸다가 
                // postsQuery로 정렬해놓은애를 querySnapshot 이 친구로 받아서 겟독을 할건데 
                // 정렬해놓은 거 다 가져온 것 중에서 
                querySnapshot.docs.map(async postList => {
                    // 포스트 리스트로 변환을 먼저 시키는동안 기다렸다가 매핑을 할 거고 
                const postData = postList.data() as PostProps; // 포스트 프롭 타아ㅣㅂ으로 가져오기 
                const authorId = postData?.uid; // 작성자 아이디
                const authorRef = doc(db, 'Users', authorId);
                const authorSnap = await getDoc(authorRef);
                console.log(authorSnap)
                const authorData = authorSnap.data();
                console.log(authorData)

                return {
                    ...postData,
                    id: postList.id,
                    authorDisplayName: authorData?.displayName,
                    authorProfileUrl: authorData?.photoURL,
                };
            })
        );

        const filteredPosts = getPosts.filter(post => {
            if (tab === 'following') {
                return user.uid === post.uid || following.includes(post.uid);
            }
            return true;
        });

        setPosts(filteredPosts);
    } else {
        console.error("포스트 못가져옴");
    }
    setLoading(false);  
    
};



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
