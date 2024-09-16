import React, { useCallback, useContext, useEffect, useState } from "react";
import { Avatar, Box, IconButton, Tooltip } from "@mui/material";
import { LuPencilLine } from "react-icons/lu";
import { MdDelete } from "react-icons/md";
import { Link, useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc, updateDoc, arrayRemove, arrayUnion, addDoc, collection } from "firebase/firestore";
import { ref, deleteObject } from "@firebase/storage";
import AuthContext from 'Context/AuthContext';
import ThemeContext from "../../Context/ThemeContext";
import { SuccessToast, ErrorToast } from '../../Context/toastConfig';
import { db, storage } from 'firebaseApp';
import AppBarHeader from "../LayOut/Header";
import { MdFavoriteBorder } from "react-icons/md";
import { MdFavorite } from "react-icons/md";
import { formatDate } from '../Util/dateUtil';
import LoadingScreen from '../Util/LoadingScreen';
import ConfirmDialog from "../ConfirmDialog";



import Comment from "./comment";

import ReactMarkDown from 'react-markdown'
import { PostWithAuthor, CommentsInterface, PostProps } from "types/InterfaceTypes";

export default function PostDetail() {
    const [openDialog, setOpenDialog] = useState(false);
    const navigate = useNavigate();
    const [post, setPost] = useState<PostWithAuthor | null>(null);
    const { theme } = useContext(ThemeContext);
    const [loading, setLoading] = useState<boolean>(true);
    const [comment, setComment] = useState<string>('');
    const { id } = useParams<{ id: string }>();
    const { user } = useContext(AuthContext);

    const handleDeleteClick = () => {
    setOpenDialog(true); // Open the confirmation dialog
  };

    const handleConfirmDelete = async () => {
        try {
            if (post?.imageUrl) {
                const imageRef = ref(storage, post.imageUrl);
                await deleteObject(imageRef);
            }
            if (post?.id) {
                await deleteDoc(doc(db, "Posts", post.id));
                SuccessToast('삭제 완료', theme);
                navigate('/');
            }
        } catch (error) {
            console.error('삭제 실패:', error);
            ErrorToast('삭제 실패', theme);
        }
        setOpenDialog(false); // Close the dialog after deletion
    };

  const handleCancelDelete = () => {
    setOpenDialog(false);
  };


    const ToggleLike = async () => {
        if (!post?.id || !user?.uid) return;
        const postRef = doc(db, 'Posts', post.id);

        const updateLikes = post?.likes?.includes(user?.uid)
            ? { likes: arrayRemove(user?.uid), likeCount: (post.likeCount || 0) - 1 }
            : { likes: arrayUnion(user?.uid), likeCount: (post.likeCount || 0) + 1 };

        await updateDoc(postRef, updateLikes);

        if (!post?.likes?.includes(user?.uid)) {
                    await addDoc(collection(db, 'Notification'), {
                        uid: id, // 알림을 받을 사용자 
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        url: `/user/${user.uid}`,
                        content: '님이 회원님의 게시물에 좋아요를 남겼어요',
                        authorUid: user?.uid,
                        // 알림을 보낸 사용자 uid
                    });
            }


        getPost(post.id); 
    };

    const getPost = useCallback(async (id: string) => {
        if (id) {
            try {
                console.log('Fetching post with ID:', id);
                const docRef = doc(db, 'Posts', id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const postData = docSnap.data() as PostProps;

                    // 작성자 정보 
                    const authorRef = doc(db, 'Users', postData.uid);
                    const authorSnap = await getDoc(authorRef);
                    const authorData = authorSnap.data();

                    // 댓글 작성자 정보 가져오기
                    const commentsWithAuthor = await Promise.all(
                        postData.comments?.map(async (comment) => {
                            const commentAuthorRef = doc(db, 'Users', comment.uid);
                            const commentAuthorSnap = await getDoc(commentAuthorRef);
                            const commentAuthorData = commentAuthorSnap.data();

                            return {
                                ...comment,
                                authorDisplayName: commentAuthorData?.displayName,
                                authorProfileUrl: commentAuthorData?.photoURL,
                            };
                        }) || []
                    );

                    setPost({
                        ...postData,
                        id: docSnap.id,
                        authorDisplayName: authorData?.displayName,
                        authorProfileUrl: authorData?.photoURL,
                        comments: commentsWithAuthor,
                    });
                } else {
                    ErrorToast('게시글을 찾을 수 없습니다.', theme);
                    navigate('/');
                }
            } catch (error) {
                ErrorToast('게시글 로드 오류', theme);
            } finally {
                setLoading(false);
            }
        }
    }, [navigate, theme]);

    useEffect(() => {
        if (id) getPost(id);
    }, [id, getPost, theme]);  


    return (
        <>
        <AppBarHeader title={post?.authorDisplayName} showBackButton={true}/>
        
        <div className="PostDetail">
            {loading ? (

                <LoadingScreen isLoading={loading} />

            ) : (
                post ? (
                    <>
                        <div className='Detail_AuthorArea'>
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
                                    {/* {post.email === user?.email && (
                                            <p className='AuthorArea_Date'> 마지막 수정 {formatDate(post.lastModifyAt)}</p> 
                                        )} */}
                                </div>
                                    
                            </div>
                        </Link>

                            <div className="PostDetail_At_box">
                                {post.email === user?.email && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Link to={`/Posts/edit/${post.id}`}>
                                            <Tooltip title="수정">
                                                <IconButton sx={{ color: theme === 'light' ? "#3D3A50" : "#F7F7F7" }}>
                                                    <LuPencilLine size={20} />
                                                </IconButton>
                                            </Tooltip>
                                        </Link>

                                        <Tooltip title="삭제">
                                            <IconButton
                                                sx={{ color: theme === 'light' ? "#3D3A50" : "#F7F7F7" }}
                                                onClick={handleDeleteClick}
                                            >
                                                <MdDelete size={20} />
                                            </IconButton>
                                        </Tooltip>

                                        <ConfirmDialog
                                            open={openDialog}
                                        

                                            content="정말로 게시글을 삭제하시겠습니까?"
                                            onConfirm={handleConfirmDelete}
                                            onCancel={handleCancelDelete}
                                        />

                                    </Box>
                                )}
                            </div>
                        </div>

                        {post.imageUrl && (
                            <div className="PostDetailContext">
                                <img
                                    src={post.imageUrl}
                                    alt="Post"
                                    style={{ width: '100%', objectFit: 'cover' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                
                                <IconButton
                                    sx={{
                                        display: 'flex',
                                        gap: '5px',
                                        color: theme === 'light' ? "#3D3A50" : "#F7F7F7" }}
                                    onClick={ToggleLike}
                                >
                                    {user && post?.likes?.includes(user.uid) ? (
                                        <MdFavorite color='red' size={25} />
                                    ) : (
                                        <MdFavoriteBorder size={25} />
                                    )}
                                    <span className='likeCount'>{post?.likeCount || 0}</span>
                                </IconButton>

                                </div>

                            </div>
                        )}
                        
                        <div className="PostDetailContext_text">
                            <h2 className="PostDetailtitle">{post.title}</h2>
                            <div className="PostDetailcontext">
                                <ReactMarkDown>
                                    {post.context}
                                </ReactMarkDown>
                            </div>
                        </div>
                        
                        <div className="PostDetailComments">
                            <Comment post={post as PostProps} getPost={getPost} />
                            {post.comments && post.comments.length === 0 && (
                                <p className="noPostlist">댓글이 없습니다.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <p> 에러 ! </p>
                )
            )}
        </div>
        </>
    );
}
