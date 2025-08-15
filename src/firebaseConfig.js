import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIza...your_key...",
  authDomain: "project-myprofile.firebaseapp.com",
  projectId: "project-myprofile",
  storageBucket: "project-myprofile.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:xxxx"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
