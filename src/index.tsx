import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRegistry } from 'react-native';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthContextProvider } from './Context/AuthContext';
import { ThemeContextProvider } from './components/ThemeContext';
import App from './App';
import { Platform } from 'react-native';

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
  }
} else {
  // 네이티브 환경 설정
  AppRegistry.registerComponent('MyApp', () => App);
}
