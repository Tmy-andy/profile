import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBadtpcnDQ2znIGDUyKfUmHSf-oXErDR8",
  authDomain: "project-myprofile.firebaseapp.com",
  projectId: "project-myprofile",
  storageBucket: "project-myprofile.appspot.com",
  messagingSenderId: "1009402800110",
  appId: "1:1009402800110:web:3cf713e1d25cdfcd8a90ff",
  measurementId: "G-8PF3Y0H601"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
