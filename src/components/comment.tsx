import React, { useContext, useState } from 'react';
import { Avatar, IconButton, Tooltip } from "@mui/material";
import { FaAngleUp } from 'react-icons/fa6';
import { FaRegTrashAlt } from 'react-icons/fa';
import { addDoc, arrayRemove, arrayUnion, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import AuthContext from 'Context/AuthContext';
import { ErrorToast, SuccessToast } from './toastConfig';
import ThemeContext from './ThemeContext';
import { TiArrowUp } from "react-icons/ti";
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from './dateUtil';
import { CommentsInterface, PostProps } from 'types/postTypes';

interface CommentsProps{
    post: PostProps;
    getPost: (id: string) => void;
}
export default function Comment({post, getPost} : CommentsProps){
    console.log(post)
    const [comment, setComment ] = useState('');
    const {user } = useContext(AuthContext);
    const {theme } = useContext(ThemeContext)
    const navigate = useNavigate();
    
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const {
            target: {name, value}
        } = e;

        if(name === 'comment'){
            setComment(value)
        }
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
                SuccessToast('댓글 생성 완료', theme);
                setComment('');
            } catch (error) {
                console.log(error);
                ErrorToast('댓글 생성 실패', theme);
            }
        }
    };

const DeleteComment = async (data: CommentsInterface) => {
    const confirm = window.confirm('해당 댓글을 삭제하시겠습니까?');
    if (confirm && post.id) {
        try {
            const postRef = doc(db, 'Posts', post.id);
            await updateDoc(postRef, {
                comments: arrayRemove({
                    ...data
                })
            });
            SuccessToast('댓글을 삭제했습니다', theme);
            await getPost(post.id);
        } catch (error) {
            console.error('댓글 삭제 오류:', error);
            ErrorToast('댓글 삭제 실패', theme);
        }
    }
};




    return (
        <div className="Comment_Area">
            <h3> 댓글 {post?.comments?.length || 0}개 </h3>
            <div className="Comment_textArea">
                <form className="Comment_textArea" onSubmit={onSubmit}>
                    <textarea
                        name="comment"
                        className="Comment"
                        onChange={onChange}
                        value={comment}

                        placeholder="댓글을 입력하세요"
                    />
                    <button
                        type="submit"
                        disabled={!comment}
                        className="commentbutton"
                    >
                        <TiArrowUp color="#f7f7f7" size={25} />
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
                                        onClick={() => DeleteComment(comment)}
                                    >
                                        <FaRegTrashAlt size={16} />
                                    </IconButton>
                                </Tooltip>
                            )}

                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}