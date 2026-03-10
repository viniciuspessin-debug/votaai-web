import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAts2gnUCTGn6JNYm3p6bSloKIbqp6vhsI",
  authDomain: "votaai.app",
  projectId: "votaai-9b91d",
  storageBucket: "votaai-9b91d.firebasestorage.app",
  messagingSenderId: "397158117689",
  appId: "1:397158117689:web:9caba03f7a21e97721f8e8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
