// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCd-eqy7dNU7SZe_n8ykDZK1FcJRCeSIZg",
    authDomain: "react-commerce-26d4a.firebaseapp.com",
    projectId: "react-commerce-26d4a",
    storageBucket: "react-commerce-26d4a.appspot.com",
    messagingSenderId: "744332631614",
    appId: "1:744332631614:web:778b7e911d2a8de8107b6f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// React에서 정상적으로 동작하는 지 확인하기 위해서 임시로 export 시켜줍니다. app이 정상적으로 출력되는 것을 확인하고 나면, 지워줍니다.
// export default app

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);