import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhCCQRbXhVCnrllTrwfB_KAkHhEVWc_Xo",
  authDomain: "mehfil-e-naat-51af5.firebaseapp.com",
  projectId: "mehfil-e-naat-51af5",
  storageBucket: "mehfil-e-naat-51af5.firebasestorage.app",
  messagingSenderId: "794671783024",
  appId: "1:794671783024:web:10b76ec0f7b05575ee68b5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
