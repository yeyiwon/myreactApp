import React, { useState, KeyboardEvent, useContext } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { Button, TextField, IconButton, InputAdornment, FormControl, FormHelperText, Box, Stepper, Step, StepLabel, Typography, Avatar } from '@mui/material';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth'; 
import { app, db } from 'firebaseApp'; 
import { useNavigate } from 'react-router-dom';
import ThemeContext from './ThemeContext';
import { SuccessToast, ErrorToast } from './toastConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

const steps = ['닉네임', '이메일 주소', '비밀번호', '비밀번호 확인', '프로필 사진'];

export default function SignupForm() {
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const { theme } = useContext(ThemeContext);
    const [activeStep, setActiveStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [passwordValidation, setPasswordValidation] = useState<string | null>(null);
    const navigate = useNavigate();

    const FuncShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const validatePassword = (password: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            setPasswordValidation('비밀번호는 8자 이상이어야 합니다.');
        } else if (!hasUpperCase || !hasLowerCase || !hasDigit || !hasSpecialChar) {
            setPasswordValidation('비밀번호는 대문자, 소문자, 숫자, 특수 문자를 포함해야 합니다.');
        } else {
            setPasswordValidation(null);
        }
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) ? '' : '유효한 이메일 주소를 입력하세요';
    };

    const validateField = (fieldName: string, value: string) => {
        let validationErrors = { ...errors };

        switch (fieldName) {
            case 'name':
                validationErrors.name = value ? '' : '닉네임을 입력하세요';
                break;
            case 'email':
                validationErrors.email = value ? validateEmail(value) : '이메일을 입력하세요';
                break;
            case 'password':
                validationErrors.password = value ? '' : '비밀번호를 입력하세요';
                validatePassword(value);
                break;
            case 'confirmPassword':
                validationErrors.confirmPassword = value === password ? '' : '비밀번호가 일치하지 않습니다';
                break;
            default:
                break;
        }

        setErrors(validationErrors);
    };

    const FuncChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setter(value);
        validateField(field, value);
    };

    const FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const file = e.target.files[0];
            setProfilePicture(file);
            setProfilePicturePreview(URL.createObjectURL(file));
        }
    };

    const FuncNext = () => {
        let newErrors = { ...errors };
        let canProceed = true;

        switch (activeStep) {
            case 0:
                if (!name) {
                    newErrors.name = '닉네임을 입력하세요';
                    ErrorToast('닉네임을 입력하세요', theme);
                    canProceed = false;
                } else {
                    delete newErrors.name;
                }
                break;
            case 1:
                if (!email) {
                    newErrors.email = '이메일을 입력하세요';
                    ErrorToast('이메일을 입력하세요', theme);
                    canProceed = false;
                } else if (newErrors.email) {
                    ErrorToast(newErrors.email, theme);
                    canProceed = false;
                } else {
                    delete newErrors.email;
                }
                break;
            case 2:
                if (!password) {
                    newErrors.password = '비밀번호를 입력하세요';
                    ErrorToast('비밀번호를 입력하세요', theme);
                    canProceed = false;
                } else if (passwordValidation) {
                    ErrorToast(passwordValidation, theme);
                    canProceed = false;
                } else {
                    delete newErrors.password;
                }
                break;
            case 3:
                if (password !== confirmPassword) {
                    newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
                    ErrorToast('비밀번호가 일치하지 않습니다', theme);
                    canProceed = false;
                } else {
                    delete newErrors.confirmPassword;
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);

        if (canProceed) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const FuncBack = () => {
        if (activeStep === 0) {
            window.history.back();
        } else {
            setActiveStep(prevActiveStep => prevActiveStep - 1);
        }
    };

const FuncSubmit = async () => {
    try {
        const auth = getAuth();
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 프로필 사진 URL 초기화
        let profilePictureURL: string | null = null;

        // 프로필 사진이 있는 경우, Firebase Storage에 업로드 후 URL 가져오기
        if (profilePicture) { 
            const storage = getStorage();
            const fileName = `${user.uid}_${profilePicture.name}`; // UID와 파일 닉네임 결합
            const storageRef = ref(storage, `profile_pictures/${fileName}`);
            await uploadBytes(storageRef, profilePicture);
            profilePictureURL = await getDownloadURL(storageRef);
        }

        await updateProfile(user, {
            displayName: name,
            photoURL: profilePictureURL || null,
        });

        const userRef = doc(db, 'Users', user.uid);
        await setDoc(userRef, {
            displayName: name,
            photoURL: profilePictureURL || null, // Firestore에 photoURL만 저장
            email: user.email
        });

        SuccessToast('회원가입이 완료되었습니다 로그인을 해주세요', theme);
        navigate('/Login');
        
    } catch (error) {
        console.error("회원가입 오류: ", error);
        ErrorToast('회원가입 중 오류가 발생했습니다.', theme);
    }
};


    const isButtonDisabled = () => {
        return (activeStep === steps.length - 1 && (password !== confirmPassword || !password || !confirmPassword));
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
    };


    return (
        <Box>
            <div className='StepperBox'>
                <Stepper activeStep={activeStep} alternativeLabel
                    sx={{
                        '& .MuiStepIcon-root': {
                            color: '#ccc'
                        },
                        '& .MuiStepLabel-label': {
                            fontSize: '11px',
                            color: theme === 'light' ? "#1A1C22" : '#F7F7F7'
                        },
                        '& .MuiStepIcon-root.Mui-completed': {
                            color: '#580EF6',
                        },
                        '& .MuiStepIcon-root.Mui-active': {
                            color: '#580EF6'
                        },
                        '& .MuiStepIcon-root.Mui-active .MuiStepIcon-text': {
                            fontWeight: 'bold',
                        },
                        '& .MuiStepLabel-label.Mui-active' : {
                            color: theme === 'light' ? '#1A1C22' : '#F7F7F7',
                            fontWeight: 'bold'
                        },
                        '& .MuiStepLabel-label.Mui-completed': {
                            color: theme === 'light' ? '#1A1C22' : '#F7F7F7',
                            
                        },

                    }}
                >
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                

            </div>
                <form className='formClassBox' noValidate autoComplete="off" onSubmit={FuncSubmit}>
                        <Typography sx={{ 
                            color: theme === 'light' ? "#1A1C22" : '#F7F7F7',
                            mt: 2, mb: 1, textAlign: 'center', fontWeight: 'bold' }}>{steps[activeStep]}</Typography>
                            {activeStep === 0 && (
                                <TextField
                                    autoFocus
                                    className='customtextField'
                                    label="닉네임"
                                    fullWidth
                                    required
                                    value={name}
                                    onChange={FuncChange(setName, 'name')}
                                    sx={{ margin: '10px 0' }}
                                    error={Boolean(errors.name)}
                                    helperText={errors.name}
                                    onKeyDown={onKeyDown}
                                />
                            )}
                            {activeStep === 1 && (
                                <TextField
                                    autoFocus
                                    className='customtextField'
                                    label="이메일 주소"
                                    fullWidth
                                    required
                                    value={email}
                                    onChange={FuncChange(setEmail, 'email')}
                                    sx={{ margin: '10px 0' }}
                                    error={Boolean(errors.email)}
                                    helperText={errors.email}
                                    onKeyDown={onKeyDown}
                                />
                            )}
                            {activeStep === 2 && (
                                <FormControl fullWidth sx={{ margin: '10px 0' }} error={Boolean(errors.password)}>
                                    <TextField
                                        autoFocus
                                        className='customtextField'
                                        label="비밀번호"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={FuncChange(setPassword, 'password')} 
                                        onKeyDown={onKeyDown}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={FuncShowPassword}
                                                        sx={{ 
                                                            color: theme === 'light' ? '#1A1C22' : '#F7F7F7'
                                                            }}
                                                    >
                                                        {showPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        
                                    />
                                    <FormHelperText sx={{ color: 'red' }}>{errors.password || passwordValidation}</FormHelperText>
                                </FormControl>
                            )}
                            {activeStep === 3 && (
                                <FormControl fullWidth sx={{ margin: '10px 0' }} error={Boolean(errors.confirmPassword)}>
                                    <TextField
                                        autoFocus
                                        className='customtextField'
                                        label="비밀번호 확인"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={FuncChange(setConfirmPassword, 'confirmPassword')}
                                        onKeyDown={onKeyDown}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={FuncShowPassword}
                                                        sx={{ 
                                                            color: theme === 'light' ? '#1A1C22' : '#F7F7F7'
                                                            }}
                                                    >
                                                        {showPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        
                                    />
                                    <FormHelperText sx={{ color: 'red' }}>{errors.confirmPassword}</FormHelperText>
                                </FormControl>
                            )}
                            {activeStep === 4 && (
                        <FormControl fullWidth sx={{ margin: '10px 0' }}>
                            <div className='signupProfile'>
                                <Avatar
                                    src={profilePicturePreview || ''}
                                    alt="Profile Preview"
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                        boxShadow: '0px 0px 10px 1px rgba(0,0,0,0.2)'
                                    }}
                                />
                                <Button
                                    sx={{
                                        boxShadow: '1px 1px 5px 1px rgba(0,0,0,0.2)',
                                        marginTop: '20px',
                                        backgroundColor: '#580Ef6',
                                        color: '#F7F7F7',
                                        fontWeight: 'bold',
                                    }}
                                    variant="contained"
                                    component="label"
                                >
                                    사진 선택
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={FileChange}
                                    />
                                </Button>
                            </div>
                        </FormControl>
                            )}
                        <Box sx={{ display: 'flex', flexDirection: 'row'}}>
                            <Button
                                onClick={FuncBack}
                                sx={{ mr: 1, 
                                color: theme === 'light' ? "#1A1C22" : "#F7F7F7" 
                                }}
                            >
                                {activeStep === 0 ? '이전 페이지' : '이전 단계'}
                            </Button>
                            <Box sx={{ flex: '1 1 auto' }} />
                            <Button
                                sx={{ color: theme === 'light' ? "#1A1C22" : "#F7F7F7", fontWeight: 'bold' }}
                                disabled={isButtonDisabled()}
                                // type="submit"
                                onClick={activeStep === steps.length - 1 ? FuncSubmit : FuncNext} 
                            >
                                {activeStep === steps.length - 1 ? '회원가입 완료 🎉' : '다음 단계'}
                            </Button>
                        </Box>
                </form>
        </Box>
    );
}
