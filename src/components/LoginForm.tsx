import React, { useContext, useState } from 'react';
import { Button, TextField, IconButton, InputAdornment, Divider } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
import { app } from 'firebaseApp';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { SuccessToast, ErrorToast  } from './toastConfig';
import ThemeContext from 'components/ThemeContext';
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from 'react-icons/fa';


export default function LoginForm() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const { theme } = useContext(ThemeContext);
    const [userName, setUserName] = useState<string | null>(null);
    
    const FuncShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const SocialLogin = async (e: any ) => {
        const{
            target: {name}, 
        } = e;

        let provider;
        const auth = getAuth(app);

        if (name === 'google') {
            provider = new GoogleAuthProvider();
        }
        if (name === 'github') {
            provider = new GithubAuthProvider(); 
        }

        await signInWithPopup(auth, 
            provider as GoogleAuthProvider | GithubAuthProvider
            ).then((res) => {
            const user = res.user;

            console.log(res);
            SuccessToast(`${user?.displayName}` + '님 환영합니다' , theme);
        }).catch((error) => {
            ErrorToast('로그인 실패', theme)
        })
    }

    // e React.FormEvent<HTMLFormElement> 객체가 폼 제출과 관련된 이벤트라는 것 TypeScript는 이 타입에 맞는 속성과 메서드를 제공
    const LoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // e.target은 HTMLFormElement 타입으로 다뤄짐
        // setLoading(true);
        const auth = getAuth(app);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            SuccessToast(`${user?.displayName}` + '님 환영합니다', theme);
            navigate("/");
        } catch (error) {
            console.error('로그인 오류:', error);
            ErrorToast('이메일 또는 비밀번호를 확인하세요.', theme);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-form">
            <form className='formClassBox' onSubmit={LoginSubmit} noValidate>
                <img src="../Image/Ghost.png" alt="" />
                <TextField
                    className='customtextField'
                    label="이메일"
                    type="email"
                    fullWidth
                    required
                    sx={{ margin: '10px 0' 
                    }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                    className='customtextField'
                    label="비밀번호"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    required
                    sx={{ margin: '10px 0' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={FuncShowPassword} 
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
                <div className='linkform'>
                    계정이 없으신가요?
                    <Link to='/Signup' className="form_link"> 회원가입하기 </Link>
                </div>
                <Button
                    sx={{
                        boxShadow: '1px 1px 5px 1px rgba(0,0,0,0.2)',
                        marginTop: '20px',
                        background: '#580EF6',
                        fontWeight: 'bold',
                        height: '50px'
                    }}
                    type="submit"
                    variant="contained"
                    fullWidth
                >
                    LOGIN
                    
                </Button>
        {/* <div className='social-login'> */}

            <Divider sx={{ marginTop: '30px' }}> <p className="social-title">소셜 계정으로 간편 로그인</p> </Divider>

            <div className='social_box'>
                <Button
                    onClick={SocialLogin}
                    name='google'
                    type="button"
                    sx={{  background: '#fff', borderRadius: '50%', width: 50, height: 50, minWidth: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F7F7', padding: 0 
                    }}>
                    <FcGoogle size={28} />
                </Button>
                <Button
                    name='github'
                    onClick={SocialLogin}
                    type="button"
                    sx={{
                        // background: 'rgba(0,0,0,0.2)',
                        color: '#000000',
                        borderRadius: '50%',
                        width: 50,
                        height: 50, 
                        minWidth: 0, 
                        display: 'flex', 
                        background: '#fff',
                        justifyContent: 'center', 
                        alignItems: 'center',
                        
                        padding: 0 
                    }}>
                        <FaGithub size={28}/>
                    </Button>
                    
                </div>

            </form>
        </div>
    );
}
