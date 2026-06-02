import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase SAMA SEPERTI DI script.js
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

let editingId = null;

async function loadProducts() {
    const querySnapshot = await getDocs(collection(db, "products"));
    const adminList = document.getElementById('adminProductList');
    adminList.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
        const product = doc.data();
        const div = document.createElement('div');
        div.className = 'admin-product-item';
        div.innerHTML = `
            <div class="admin-product-info">
                <h3>${product.name}</h3>
                <p>Harga: Rp ${product.price.toLocaleString()}</p>
                <p>Kategori: ${product.category}</p>
            </div>
            <div class="admin-actions">
                <button class="edit-btn" onclick="editProduct('${doc.id}', '${product.name}', ${product.price}, '${product.category}', '${product.imageUrl}')">Edit</button>
                <button class="delete-btn" onclick="deleteProduct('${doc.id}')">Hapus</button>
            </div>
        `;
        adminList.appendChild(div);
    });
}

window.editProduct = (id, name, price, category, imageUrl) => {
    editingId = id;
    document.getElementById('productId').value = id;
    document.getElementById('productName').value = name;
    document.getElementById('productPrice').value = price;
    document.getElementById('productCategory').value = category;
    document.getElementById('productImage').value = imageUrl;
    document.getElementById('saveBtn').textContent = 'Update Produk';
    document.getElementById('cancelBtn').style.display = 'inline-block';
};

window.deleteProduct = async (id) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
    }
};

document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('productName').value;
    const price = parseInt(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const imageUrl = document.getElementById('productImage').value;
    
    if (!name || !price || !category || !imageUrl) {
        alert('Semua field harus diisi!');
        return;
    }
    
    if (editingId) {
        await updateDoc(doc(db, "products", editingId), {
            name, price, category, imageUrl
        });
        alert('Produk berhasil diupdate!');
        editingId = null;
        document.getElementById('saveBtn').textContent = 'Simpan Produk';
        document.getElementById('cancelBtn').style.display = 'none';
    } else {
        await addDoc(collection(db, "products"), {
            name, price, category, imageUrl
        });
        alert('Produk berhasil ditambahkan!');
    }
    
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productId').value = '';
    loadProducts();
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    editingId = null;
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productId').value = '';
    document.getElementById('saveBtn').textContent = 'Simpan Produk';
    document.getElementById('cancelBtn').style.display = 'none';
});

loadProducts();