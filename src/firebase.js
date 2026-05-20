import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC63ZgrDr6Fy6uAdJimbDtHd0hRHlmrk9U",
  authDomain: "announcementssubmission.firebaseapp.com",
  projectId: "announcementssubmission",
  storageBucket: "announcementssubmission.firebasestorage.app",
  messagingSenderId: "496364679489",
  appId: "1:496364679489:web:38f1d4103149c8342b31c0",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: "select_account",
});

export {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onAuthStateChanged,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signOut,
  updateDoc,
  where,
};
