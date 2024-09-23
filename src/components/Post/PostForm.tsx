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
    const { theme } = useContext(ThemeContext);
    const [post, setPost] = useState<PostProps | null>(null);


    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "title") {
            setTitle(value);
        } else if (name === "context") {
            setContext(value);
        }
    };

    // 이미지 올리기 
    const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
        }
    };
    // 이미지 스토리지에 저장을 위해 `${user?.uid}/${uuidv4()}`; 스토리지 저장 경로/고유 id 값으로 저장
    const uploadImage = async (file: File) => {
    // uploadImage를 async로 처리하기 위해 file: File 인자로 받음
    const key = `/postimage/${user?.uid}/${uuidv4()}`;
    // key에 스토리지에 저장할 고유의 값을 만들어줌
    const storageRef = ref(storage, key);
    // storageRef를 사용해 uploadBytes로 파일을 스토리지에 업로드
    const snapshot = await uploadBytes(storageRef, file);
    // uploadBytes: 스토리지에 파일을 업로드하고 업로드 상태를 반환
    // getDownloadURL: 업로드한 파일의 URL을 반환
    return await getDownloadURL(snapshot.ref); // 업로드한 파일의 다운로드 URL을 반환
};

    const deleteImage = async (url: string) => {
        // 사진을 바꾸거나 삭제할 때 스토리지에서도 삭제 
        const imageRef = ref(storage, url.split('?')[0]);
        // url.split('?')[0]); 가 url 만 받을수 있는 역할 
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

    let imageUrl = post?.imageUrl || "";

    if (imageFile) {
        if (post?.imageUrl) await deleteImage(post.imageUrl);
        imageUrl = await uploadImage(imageFile); 
        // 수정할때 
    }

    const postData = {
        title,
        context,
        imageUrl,
        createAt: post?.createAt || new Date().toISOString(), 
        lastModifyAt: new Date().toISOString(), 
        uid: user?.uid || '',
        displayName: user?.displayName || '',
        profileUrl: user?.photoURL || '',
        email: user?.email || '',
        backgroundColor: getRandomColor()
    };

    if (post && post.id) {
        await updateDoc(doc(db, 'Posts', post.id), postData);
        SuccessToast('게시글을 수정했습니다', theme);
        navigate(`/Posts/${post.id}`);

    } else {
        await addDoc(collection(db, "Posts"), postData); 
        SuccessToast('업로드 완료', theme);
        navigate('/');
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

    // 수정할 떄용 useEffect(() => {},[psrams.id])
    useEffect(() => {
    const getPost = async () => {
        if (params.id) {
            const docRef = doc(db, 'Posts', params.id);
                console.log(docRef)
                // if (params.id) 있을 때만
                const postDoc = await getDoc(docRef);

                if (postDoc.exists()) {
                    const postData = postDoc.data() as PostProps;
                    setPost({ ...postData, id: postDoc.id });
                    setTitle(postData.title);
                    setContext(postData.context);
                    setImageFile(null);
                } else {
                    console.error("데이터 없음!");
                }
            }
        };
    getPost();
}, [params.id]);

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
                >
                    {post?.id ? '수정하기' : '업로드'}
                </Button>
            </form>
        </div>
    );
}

