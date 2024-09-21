import { initializeApp, getApp, FirebaseApp } from "firebase/app";
import "firebase/auth";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "@firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

import { FirebaseOptions } from 'firebase/app';

const firebaseConfig = {
    apiKey: "AIzaSyA7P8sCIYVJnEb-EClk2LIo_oLtVfLiFqo",
    authDomain: "mysnsproject-77f84.firebaseapp.com",
    projectId: "mysnsproject-77f84",
    storageBucket: "mysnsproject-77f84.appspot.com",
    messagingSenderId: "222553400527",
    appId: "1:222553400527:web:3835c5a296e31108a203ba"
};

export let app: FirebaseApp;

try{
    app = getApp("app");
} catch(e) {
    app = initializeApp(firebaseConfig, 'app')
}

const firebase = initializeApp(firebaseConfig)

export const db = getFirestore(app);

export const storage = getStorage(app);

const auth = getAuth(app);

// FCM 설정 추가
export const messaging = getMessaging(app);

// // VAPID 키를 사용하여 FCM 토큰 가져오기
// export const requestNotificationPermission = async () => {
//     try {
//         const permission = await Notification.requestPermission();
//         if (permission === 'granted') {
//             const vapidKey = 'BNKxzqBcyfhs485sfZRXwIcoCmFjRBmwDiCuX7pY8Cqej7Paw6vFzFlk6tLueIGaldhzo1zUM42aD1zw1Paz254'; 
//             const token = await getToken(messaging, { vapidKey });
//             console.log('FCM Token:', token);
//             // Firestore에 저장하거나, 서버로 보내는 로직 추가 가능
//         } else {
//             console.log('Notification permission denied');
//         }
//     } catch (error) {
//         console.error('Error getting notification permission:', error);
//     }
// };

// // 메시지 수신 처리
// onMessage(messaging, (payload) => {
//     console.log('Message received. ', payload);
//     // 브라우저 알림 표시 또는 추가 처리 로직
//     new Notification(payload.notification?.title || "New Message", {
//         body: payload.notification?.body,
//         icon: payload.notification?.icon || "/logo512.png",
//     });
// });



export default firebase