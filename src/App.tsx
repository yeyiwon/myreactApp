import React, { useState, useEffect, useContext } from 'react';
import { Box } from '@mui/material';
import Router from './components/Router';
import { app } from './firebaseApp'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import ThemeContext from 'Context/ThemeContext'; 

import LoadingScreen from 'components/Util/LoadingScreen';
import { messaging } from './firebaseApp';
// import { requestNotificationPermission } from './firebaseApp';


// context API 란 컴포넌트 트리 전체에 데이터를 전역적으로 전달
// Theme 컨텍스트 tsx파일에서 정의한   
// const ThemeContext = createContext(){
//     theme: 'light', 
//     togglemode() => {}    
// }

// 이걸로 Context.Provider: Context API를 통해 제공하는 걸 
//<ThemeContext.Provider value={{ theme, toggleMode }}>
//        {children}
//    </ThemeContext.Provider> 
// useContext로 정의해둔 거 가져다 쓰는 원리다 .


function App() {
    const context = useContext(ThemeContext);
    const auth = getAuth(app);
    const [init, setInit] = useState<boolean>(false);
    // 현재는 항상 false 나갔다 오면 로그아웃이 되는 상태임 추후에 쿠키 로컬스토리지 세션 ? 할지 말지 고민중 
    // typescript 문법으로 useState<boolean>(false) 를 해서 true / false 의 값만 받기 위해 적어주는 공식임
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!auth?.currentUser);
    
    // currentUser 가 있는 지 없는 지 useState<boolean>으로확인 
    useEffect(() => {
        // requestNotificationPermission();
        //파이어베이스 실시간 확인 onAuthStateChanged
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
            // 인증 상태를 확인한 후 이걸 트루로 바꿔서 로딩 화면이 들어가게 
            setInit(true); // 호출이 되면 항상 true
        });
    }, [auth]); 
    // auth 값이 바뀔 때마다 호출 유저가 있다면 true 없으면 false 

    return (
        // 컨텍스트 안에 테마가 !
        <div className={context.theme == "light" ? "light" : "dark"}>
            <ToastContainer stacked />
            <Box>
                <Box>

                <LoadingScreen isLoading={!init} />
                {init ? <Router isAuthenticated={isAuthenticated} /> : null}
            </Box>
            </Box>


        </div>
    );
}

export default App;
