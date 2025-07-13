import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBPLSESa0QKb55FwSoVz2lgRIOfRX-zJjk",
  authDomain: "ac-work-ad274.firebaseapp.com",
  projectId: "ac-work-ad274",
  storageBucket: "ac-work-ad274.firebasestorage.app",
  messagingSenderId: "486151268585",
  appId: "1:486151268585:web:f27e8ea056e10693a62878",
  measurementId: "G-EL9R37GVPF"
};

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }
