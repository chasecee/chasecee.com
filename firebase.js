import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDs6-wmk-lBSyCkTnm4B_NgTTz77ozvHkQ",
  authDomain: "cee-app-677b7.firebaseapp.com",
  projectId: "cee-app-677b7",
  storageBucket: "cee-app-677b7.appspot.com",
  messagingSenderId: "335503160156",
  appId: "1:335503160156:web:0ba0c1655c17f1e9b70799",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
