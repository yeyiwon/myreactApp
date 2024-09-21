import { ReactNode, createContext, useEffect, useState } from "react";
import { User, getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "firebaseApp";

interface AuthProps {
    children: ReactNode
    // 모든 인터페이스를 받기 위해 
    // AuthContextProvider 모든 타입의 자식을 받을 수 있도록 
}

const AuthContext = createContext({
    user: null as User | null,
});

// createContext: 기본값을 user: null 로 가진 새로운 컨텍스트를 생성함. 유저 상태를 null로 초기화하고, 나중에 Firebase에서 받아온 유저 정보를 여기서 공유
// User | null : user가 null이거나 User 객체일 수 있음

export const AuthContextProvider = ({ children }: AuthProps ) => {
    // AuthContextProvider: 이 컴포넌트는 children을 받아서 AuthContext.Provider로 감싸 전역으로 유저 정보 관리 
    const auth = getAuth(app);
    const [currentUser, setCurrentUser ] = useState<User | null>(null);

    // useState<User | null>(null): 초깃값이 null인 유저 상태를 정의함. 이후 Firebase에서 받아온 유저로 이 값을 업데이트.

    useEffect(() => {
        // onAuthStateChanged(auth, (user) => { ... });
        // onAuthStateChanged: Firebase 인증 상태가 변할 때마다 콜백 함수가 실행됨. 로그인이 되면 user 객체를 반환하고, 로그아웃되면 null을 반환함.

        // setCurrentUser(user): 유저가 로그인/로그아웃될 때 상태를 업데이트해 currentUser를 설정함.
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                setCurrentUser(user);
            }
        });
    }, [auth]);


    return <AuthContext.Provider value={{user: currentUser}}>
        {children}
    </AuthContext.Provider>
}

export default AuthContext