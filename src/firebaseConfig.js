import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIza...your_key...",
  authDomain: "project-myprofile.firebaseapp.com",
  projectId: "project-myprofile",
  storageBucket: "project-myprofile.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:xxxx"
};

// Khởi tạo app
const app = initializeApp(firebaseConfig);

// Export các service để dùng trong app
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
