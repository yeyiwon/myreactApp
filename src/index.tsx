import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRegistry } from 'react-native';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthContextProvider } from './Context/AuthContext';
import { ThemeContextProvider } from './Context/ThemeContext';


import App from './App';
import { Platform } from 'react-native';
// 앱이 웹에서 실행 중인지, 모바일에서 실행 중인지를 구분하기 위해 Platform을 사용함.
// import { requestNotificationPermission } from './firebaseApp';

// 웹 환경 설정
if (Platform.OS === 'web') {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <ThemeContextProvider>
        <AuthContextProvider>

          <Router>
            <App />
          </Router>
        </AuthContextProvider>
      </ThemeContextProvider>
    );
     // 알림 권한 요청
    // requestNotificationPermission();
  }
} else {
  // 네이티브 환경 설정
  // else: 웹 환경이 아니라면, 즉 모바일 환경일 경우 React Native 방식으로 앱을 등록함.
  AppRegistry.registerComponent('MyApp', () => App);
}
