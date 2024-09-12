
import { ReactNode, createContext, useState } from "react";

//ReactNode: React 컴포넌트가 반환할 수 있는 자식 요소의 타입 
// 키워드 렌더링 모든 자식요소를 담는 거 
// createContext: 컨텍스트를 생성하는 함수
// ThemeProps를 사용해서 ThemeContextProvider 컴포넌트가 받는 프로퍼티가 
// children만 포함되고, children의 타입이 ReactNode라는 걸로 고정시키는 거임 
// 오류를 줄이기 위해서 

const ThemeContext = createContext({
    // 객체 초기값 
    theme: "light",
    toggleMode: () => {},
});

interface ThemeProps {
    children: ReactNode;
    // typescript 에서 interface를 쓰는 이유는 주로 객체의 프로퍼티와 그 타입을 명시하기 때문임 
}

export const ThemeContextProvider = ({ children }: ThemeProps) => {
    const [theme, setTheme] = useState(window.localStorage.getItem('theme') || 'light' );

    const toggleMode = () => {
        // useState 를 사용하여 theme가 light로 초기값을 해둔 거고 setTheme로 변경을 시키는 구조임 || 'light'로 해둔 거는 null or undefind 일 경우에도 light로 도ㅣ라는 의미임 
        // setTheme(prev) 로 이전(현재) 상태를 받고 업데이트를 시킬 건데 이 프레브가 light였다면 ? togglemode를 클릭했을 떄  : 다크로 바뀌게 되는 거고 이 바뀐 값이 로컬에 저장 되면서 라이트일 떈 다크 다크일 땐 라이트 
        
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
        window.localStorage.setItem('theme', theme === 'light' ? 'dark' : 'light')
    };

    return <ThemeContext.Provider value={{ theme, toggleMode }}>
        {children}
    </ThemeContext.Provider>
};

export default ThemeContext