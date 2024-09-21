import React, { useContext, useState, useEffect } from 'react';
import { TextField, Button, IconButton, Tooltip } from "@mui/material";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "firebaseApp";
import AuthContext from "Context/AuthContext";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "@firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { FaRegImage } from "react-icons/fa6";
import { LuPencilLine } from "react-icons/lu";
import { MdDelete } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import { SuccessToast, ErrorToast } from '../../Context/toastConfig';
import ThemeContext from "../../Context/ThemeContext";
import { BiCamera } from "react-icons/bi";
import { PostProps } from 'types/InterfaceTypes';

export default function PostForm() {
    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const params = useParams();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { theme } = useContext(ThemeContext);
    const [post, setPost] = useState<PostProps | null>(null);


    useEffect(() => {
        if (params.id) {
            getPost(params.id);
        }
    }, [params.id]);

    useEffect(() => {
        if (post) {
            setTitle(post.title);
            setContext(post.context);
            setImageFile(null);
        }
    }, [post]);

    const getPost = async (id: string) => {
        try {
            const docRef = doc(db, 'Posts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const postData = docSnap.data() as PostProps;
                setPost({ ...postData, id: docSnap.id });
            } else {
                console.error("데이터 없음!");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const uploadImage = async (file: File) => {
        const key = `${user?.uid}/${uuidv4()}`;
        const storageRef = ref(storage, key);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    };

    const deleteImage = async (url: string) => {
        const imageRef = ref(storage, url.split('?')[0]);
        await deleteObject(imageRef);
    };

    const removeImage = async () => {
        if (post?.imageUrl) {
            await deleteImage(post.imageUrl);
            setImageFile(null);
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let imageUrl = post?.imageUrl || "";

            if (imageFile) {
                if (post?.imageUrl) {
                    await deleteImage(post.imageUrl);
                }

                imageUrl = await uploadImage(imageFile);
            } else if (!post?.imageUrl) {
                imageUrl = ""; 
            } else {
                imageUrl = post.imageUrl; 
            }

            const postData = {
                title,
                context,
                imageUrl,
                createAt: new Date().toISOString(),
                uid: user?.uid || '',
                displayName: user?.displayName || '',
                profileUrl: user?.photoURL || '',
                email: user?.email || '',
                backgroundColor: getRandomColor()
            };

            if (post && post.id) {
                    const updatePostData = {
                        ...postData,
                        createAt: post.createAt,
                        lastModifyAt: new Date().toISOString()
                    };

            await updateDoc(doc(db, 'Posts', post.id), updatePostData)
                SuccessToast('게시글을 수정했습니다', theme);
                navigate(`/Posts/${post.id}`);
            } else {
                await addDoc(collection(db, "Posts"), postData);
                SuccessToast('업로드 완료', theme);
                navigate('/');
            }
        } catch (error) {
            console.error("오류 발생:", error);
            ErrorToast('업로드 실패', theme);
        } finally {
            setIsSubmitting(false);
            setTitle("");
            setContext("");
            setImageFile(null);
        }
    };

    const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "title") {
            setTitle(value);
        } else if (name === "context") {
            setContext(value);
        }
    };

    const getRandomColor = () => {
        const colors = [
            "#3D3A50", "#580ef6", "#1A1c22", "#f7f7f7",
            "#f01c8b", "#92FE9D", "#FFB199", "#133987",
            "#Dfe9F3", "#E1ADFA"
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <div>
            <form onSubmit={onSubmit} className='formClassBox'>
                <div className="ImageUploadPreview">
                    {imageFile || (post && post.imageUrl) ? (
                        <>
                            <img
                                src={imageFile ? URL.createObjectURL(imageFile) : post?.imageUrl}
                                alt='preview'
                                className="ImageUploadPreviewImage"
                            />
                            <div className="ImageUploadPreviewButtons">
                                <div>
                                    <Tooltip title="사진 변경하기">
                                        <IconButton component="label" sx={{ color: "#ffffff" }}>
                                            <input
                                                type="file"
                                                id="file-input-update"
                                                accept="image/*"
                                                onChange={uploadFile}
                                                hidden
                                            />
                                            <LuPencilLine size={40} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="삭제">
                                        <IconButton sx={{ color: "#ffffff" }} onClick={removeImage}>
                                            <MdDelete size={40} />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label htmlFor="file-input">
                                <IconButton component="span"
                                    sx={{
                                        color: theme === 'light' ? "#212121" : "#eeeeee"
                                    }}
                                >
                                    <BiCamera size={50} />
                                </IconButton>
                                <p style={{
                                    marginTop: '10px',
                                    color: theme === 'light' ? "#212121" : "#eeeeee"
                                }}>사진을 추가하시겠습니까?</p>
                            </label>
                            <input
                                type="file"
                                id="file-input"
                                accept="image/*"
                                onChange={uploadFile}
                                className="hidden"
                            />
                        </div>
                    )}
                </div>
                <TextField
                    name="title"
                    className="customtextField"
                    label="제목"
                    fullWidth
                    required
                    inputProps={{ maxLength: 10 }}
                    onChange={onChange}
                    value={title}
                    sx={{ margin: '20px 0' }}
                />
                <TextField
                    className="customtextField"
                    name="context"
                    label="내용"
                    fullWidth
                    multiline
                    required
                    onChange={onChange}
                    value={context}
                    minRows={6}
                    sx={{ marginBottom: '20px', whiteSpace: 'pre-wrap' }}
                />
                <Button
                    className='completeBTN'
                    type="submit"
                    sx={{ height: '50px' }}
                    fullWidth
                    disabled={isSubmitting}
                >
                    {post?.id ? '수정하기' : '업로드'}
                </Button>
            </form>
        </div>
    );
}

