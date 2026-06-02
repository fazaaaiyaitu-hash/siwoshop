import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase (GANTI DENGAN KONFIGURASI ANDA)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allProducts = [];

async function loadProducts() {
    const querySnapshot = await getDocs(collection(db, "products"));
    allProducts = [];
    querySnapshot.forEach((doc) => {
        allProducts.push({ id: doc.id, ...doc.data() });
    });
    displayProducts();
}

function displayProducts() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const filteredProducts = categoryFilter 
        ? allProducts.filter(p => p.category === categoryFilter)
        : allProducts;
    
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="price">Rp ${product.price.toLocaleString()}</div>
                <div class="category">${product.category}</div>
            </div>
        `;
        productList.appendChild(card);
    });
}

document.getElementById('categoryFilter').addEventListener('change', displayProducts);
loadProducts();