import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 🔥 KONFIGURASI FIREBASE KAMU (SUDAH BENAR)
const firebaseConfig = {
    apiKey: "AIzaSyBvjdO78HslTn9RHM4-tLsdQbJyKsSsxJk",
    authDomain: "website-5fe39.firebaseapp.com",
    projectId: "website-5fe39",
    storageBucket: "website-5fe39.firebasestorage.app",
    messagingSenderId: "243807840965",
    appId: "1:243807840965:web:a1652b48f92eb5043d1eac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ SEKARANG collection sudah bisa digunakan
export { db, storage };
export const productsCollection = collection(db, "products");
export const ordersCollection = collection(db, "orders");
export const usersCollection = collection(db, "users");
