import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRegistry } from 'react-native';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthContextProvider } from './Context/AuthContext';
import { ThemeContextProvider } from './Context/ThemeContext';
import App from './App';
import { Platform } from 'react-native';
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
  AppRegistry.registerComponent('MyApp', () => App);
}
