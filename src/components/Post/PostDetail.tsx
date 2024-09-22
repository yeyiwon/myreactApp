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
import ConfirmDialog from "../Util/ConfirmDialog";

import ReactMarkDown from 'react-markdown'
import {CommentsInterface, PostProps } from "types/InterfaceTypes";
import { FaRegTrashAlt } from "react-icons/fa";
import { TiArrowUp } from "react-icons/ti";

export default function PostDetail() {
    const [openDialog, setOpenDialog] = useState(false);
    const [post, setPost] = useState<PostProps | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [comment, setComment] = useState<string>('');
    const { id } = useParams<{ id: string }>();
    const { user } = useContext(AuthContext);
    const {theme } = useContext(ThemeContext)
    const navigate = useNavigate();
    const [selectedComment, setSelectedComment] = useState<CommentsInterface | null>(null);
    
    const getPost = async (postId: string) => {
    if (!postId) return;
    setLoading(true);

    const PostDoc = await getDoc(doc(db, 'Posts', postId));
    const postData = PostDoc.data() as PostProps;
    if (!postData) return;

    const authorDoc = await getDoc(doc(db, 'Users', postData.uid));
    const authorData = authorDoc.data();

    const commentsWithAuthor = await Promise.all(
        // 
        postData.comments?.map(async (comment) => {
            const commentAuthorDoc = await getDoc(doc(db, 'Users', comment.uid));
            const commentAuthorData = commentAuthorDoc.data();
            return {
                ...comment,
                authorDisplayName: commentAuthorData?.displayName,
                authorProfileUrl: commentAuthorData?.photoURL,
            };
        }) || []
    );

    setPost({
        ...postData,
        id: PostDoc.id,
        authorDisplayName: authorData?.displayName,
        authorProfileUrl: authorData?.photoURL,
        comments: commentsWithAuthor,
    });
    setLoading(false);
    };

    useEffect(() => {
    if (id) getPost(id);
    }, [id, theme]);

    // 댓글 관련 로직 
    const ClickOpen = (comment: CommentsInterface) => {
        setSelectedComment(comment); 
        setOpenDialog(true); 
    };
    const Close = () => setOpenDialog(false);
    
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.target.value);
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (post && post.id && user?.uid) {
            try {
                const postRef = doc(db, 'Posts', post.id);
                const CommentsObj = {
                    content: comment,
                    uid: user.uid,
                    email: user.email,
                    url: `/Posts/${post?.id}`,
                    createAt: new Date().toISOString(),
                    authorDisplayName: user.displayName || '',
                    authorProfileUrl: user.photoURL || '',
                };

                await updateDoc(postRef, {
                    comments: arrayUnion(CommentsObj),
                    // createAt: new Date().toISOString(),
                });
                    await getPost(post.id);


                // 글 작성자와 댓글 작성자 확인
                if (post.uid !== user?.uid) {
                    // 글 작성자가 댓글 작성자와 다를 때만 알림 생성
                    await addDoc(collection(db, 'Notification'), {
                        uid: post.uid,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        url: `/Posts/${post.id}`,
                        content: '님이 댓글을 남겼습니다.',
                        authorUid: user?.uid,
                    });
                }
                SuccessToast('댓글을 작성했습니다.', theme);
                setComment('');
            } catch (error) {
                console.log(error);
                ErrorToast('댓글 생성 실패', theme);
            }
        }
    };

    const DeleteComment = async () => {
        if (selectedComment && post?.id) {
            try {
                const postRef = doc(db, 'Posts', post.id);
                await updateDoc(postRef, {
                    comments: arrayRemove(selectedComment)
                });
                SuccessToast('댓글을 삭제했습니다', theme);
                await getPost(post.id);
                Close();  // Dialog 닫기
            } catch (error) {
                console.error('댓글 삭제 오류:', error);
                ErrorToast('댓글 삭제 실패', theme);
            }
        }
    };

    const DeleteClick = () => {
    setOpenDialog(true);
    };

    const ConfirmDelete = async () => {
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
        setOpenDialog(false); 
    };

    const CancelDelete = () => {
        setOpenDialog(false);
    };

    // 여까지 댓글 

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
                                                onClick={DeleteClick}
                                            >
                                                <MdDelete size={20} />
                                            </IconButton>
                                        </Tooltip>

                                        <ConfirmDialog
                                            open={openDialog}
                                        

                                            content="정말로 게시글을 삭제하시겠습니까?"
                                            onConfirm={ConfirmDelete}
                                            onCancel={CancelDelete}
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
                                
                                </div>

                            </div>
                        )}
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
                        <div className="PostDetailContext_text">
                            <h2 className="PostDetailtitle">{post.title}</h2>
                            <div className="PostDetailcontext">
                                <ReactMarkDown>
                                    {post.context}
                                </ReactMarkDown>
                            </div>
                        </div>
                        
                        <div className="PostDetailComments">
                            <div className="Comment_Area">
                                <h3> 댓글 {post?.comments?.length || 0}개 </h3>
                                <div className="Comment_textArea">
                                    <form className="Comment_text" onSubmit={onSubmit}>
                                        <textarea
                                            name="comment"
                                            className="CommentArea"
                                            onChange={onChange}
                                            value={comment}
                                            rows={2}
                                            placeholder="댓글을 입력하세요"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!comment}
                                            className="commentbutton"
                                        >
                                            <TiArrowUp color="#f7f7f7" size={35} />
                                        </button>
                                    </form>
                                </div>

                                <ul className="Comment_Item">
                                    {post?.comments?.map((comment, index) => (
                                        <li key={index}>
                                            <Link to={user?.uid === comment.uid ? `/Profile` : `/user/${comment.uid}`}
                                                onClick={(e) => {
                                                    if (user?.uid === comment.uid) {
                                                        e.preventDefault();
                                                        navigate(`/Profile`);
                                                    }
                                                }}
                                            >
                                                <Avatar
                                                    src={comment?.authorProfileUrl}
                                                    alt="profile"
                                                    className="Comment_ProfileImage"
                                                />
                                            </Link>

                                            <div className="Comment_Content">
                                                <div className="Comment_Header">
                                                    <span className="Comment_Author">{comment.authorDisplayName}</span>
                                                    <span className="Comment_Time">
                                                        {/* {comment.createAt} */}
                                                        {formatDate(comment.createAt)}
                                                    </span>
                                                </div>
                                                <span className="Comment_Text">{comment.content}</span>
                                                
                                                {comment.uid === user?.uid && (
                                                    <Tooltip title='삭제'>
                                                        <IconButton
                                                            sx={{
                                                                color: theme === 'light' ? '#1A1C22' : "#F7F7F7",
                                                                position: 'absolute',
                                                                right: 0,
                                                                top: '50%',
                                                                transform: 'translateY(-50%)',
                                                            }}
                                                            onClick={() => ClickOpen(comment)}
                                                        >
                                                            <FaRegTrashAlt size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                )}

                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                        <ConfirmDialog
                                            open={openDialog}
                                            content="댓글을 삭제하시겠습니까?"
                                            onConfirm={DeleteComment}
                                            onCancel={Close}
                                            />
                            </div>
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
