import { initializeApp, getApp, FirebaseApp } from "firebase/app";
import "firebase/auth";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "@firebase/storage";


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

export default firebase