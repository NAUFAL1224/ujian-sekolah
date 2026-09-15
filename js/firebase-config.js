// Gunakan Firebase Compat (lebih mudah untuk non-programmer)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "[ISI_DENGAN_API_KEY_ANDA]",
  authDomain: "[ISI_DENGAN_AUTH_DOMAIN_ANDA]",
  projectId: "[ISI_DENGAN_PROJECT_ID_ANDA]",
  storageBucket: "[ISI_DENGAN_STORAGE_BUCKET_ANDA]",
  messagingSenderId: "[ISI_DENGAN_MESSAGING_SENDER_ID_ANDA]",
  appId: "[ISI_DENGAN_APP_ID_ANDA]"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
