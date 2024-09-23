import { Button, TextField, Avatar, IconButton, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { MdEdit, MdDelete } from 'react-icons/md';
import { FaRegImage } from "react-icons/fa6";
import AuthContext from "Context/AuthContext";
import ThemeContext from "Context/ThemeContext";
import { deleteObject, getDownloadURL, ref, uploadBytes, uploadString } from "@firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { db, storage } from "firebaseApp";
import { updateProfile } from "firebase/auth";
import { ErrorToast, SuccessToast } from "Context/toastConfig";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import AppBarHeader from "components/LayOut/Header";
import { UserProps  } from "types/InterfaceTypes";

export default function ProfileEdit() {
    const [displayName, setDisplayName] = useState<string | null>('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext); 
    const navigate = useNavigate();

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayName(e.target.value);
    };

    const FileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // 선택한 0 번째 파일이 
        // 만약에 있다면 setProfilePicture 여기에 저장해서 new FileReader(); 이 친구가 url로 바꿀 것이고 fileReader.onloadend 이 친구가 로드를 끝 마친다면 
                // const { result } = e?.currentTarget;
                // setImageUrl(result); 여기에 보내는 거임 
        if (file) {
            setProfilePicture(file);
            const fileReader = new FileReader();
            fileReader.onloadend = (e: any) => {
                const { result } = e?.currentTarget;
                setImageUrl(result);
            };
            fileReader.readAsDataURL(file);
        }
    };

    const RemoveImage = async () => {
        if (!user || !user.photoURL) return;
        try {
            const imageRef = ref(storage, user.photoURL);
            await deleteObject(imageRef);
            await updateProfile(user, {
                photoURL: ''
            });
            setImageUrl(null);
            SuccessToast('사진이 삭제되었습니다.', theme);
        } catch (error) {
            ErrorToast('이미지 삭제 실패', theme);
        }
    };

    useEffect(() => {
        if (user?.photoURL) {
            setImageUrl(user.photoURL);
        }
        if (user?.displayName) {
            setDisplayName(user.displayName);
        }
    }, [user?.photoURL, user?.displayName]);
    // [user?.photoURL, user?.displayName]) useEffect로 얘네가 바뀌면 상태를 업뎃 하라 !
    const ProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let newPhotoURL: string | null = null;

    try {
        if (profilePicture) {
            const storageRef = ref(storage, `profile_pictures/${user?.uid}_${uuidv4()}`);
            await uploadBytes(storageRef, profilePicture);
            newPhotoURL = await getDownloadURL(storageRef);

            // 기존 프로필 사진 삭제
            if (user?.photoURL) {
                const oldStorageRef = ref(storage, user?.photoURL);
                await deleteObject(oldStorageRef);
            }
        }

        if (user) {
            await updateProfile(user, {
                displayName: displayName || '',
                photoURL: newPhotoURL || user.photoURL 
            });

            // Firestore의 'Users' 컬렉션에 사용자 정보 저장
            const userRef = doc(db, 'Users', user.uid);
            await updateDoc(userRef, {
                displayName: displayName || '',
                photoURL: newPhotoURL || user.photoURL,
                email: user.email || ''
            });

            SuccessToast('프로필 수정이 완료되었습니다.', theme);
            navigate('/Profile');
        } else {
            throw new Error('사용자 정보가 없습니다.');
        }
    } catch (error) {
        ErrorToast('프로필 수정 실패', theme);
    }
};
    return (
        <div>
            <AppBarHeader title="프로필 수정" showBackButton={true}/>
            <form onSubmit={ProfileUpdate} className='formClassBox'>
                <div className="profile-container">
                    <div className="profileImgUploadPrev">
                        <Avatar
                            src={imageUrl || user?.photoURL || ''}
                            alt="Profile"
                            sx={{ width: '150px', height: '150px', objectFit: 'cover', boxShadow: 5 }}
                        />
                        <div className="PreviewButtons">
                            {imageUrl ? (
                                <div className="buttons">
                                    <Tooltip title="사진 변경하기">
                                        <IconButton component="label" sx={{ color: "#ffffff" }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={FileUpload}
                                                hidden
                                            />
                                            <MdEdit size={20} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="삭제">
                                        <IconButton sx={{ color: "#ffffff" }} onClick={RemoveImage}>
                                            <MdDelete size={20} />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                            ) : (
                                <Tooltip title="사진 업로드">
                                    <IconButton component="label" sx={{ color: "#ffffff" }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={FileUpload}
                                            hidden
                                        />
                                        <FaRegImage size={20} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
                
                <h4 style={{ color: theme === 'light' ? '#3D3A50' :  '#f7f7f7' }} > {user?.email} </h4>
                <TextField
                    className="customtextField"
                    name="displayName"
                    label="이름"
                    fullWidth
                    required
                    sx={{ marginTop: '20px' }}
                    onChange={onChange}
                    value={displayName || ''}
                />
                <Button
                    type="submit"
                    fullWidth
                    sx={{
                        boxShadow: '1px 1px 5px 1px rgba(0,0,0,0.2)',
                        marginTop: '20px',
                        backgroundColor: '#580Ef6',
                        color: '#eeeeee',
                        fontWeight: 'bold',
                        height: '50px',
                    }}
                >
                    프로필 수정
                </Button>
            </form>
        </div>
    );
}

