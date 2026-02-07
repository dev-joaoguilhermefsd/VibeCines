// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRRvNduGwEzncZuNPfCJbluAi1NL5YV4w",
  authDomain: "login-vibecines.firebaseapp.com",
  projectId: "login-vibecines",
  storageBucket: "login-vibecines.firebasestorage.app",
  messagingSenderId: "919861521801",
  appId: "1:919861521801:web:5595941845e27e5b58c558",
  measurementId: "G-0MYW50ZEMK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);