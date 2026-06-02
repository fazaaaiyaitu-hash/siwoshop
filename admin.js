import { db, productsCollection } from 'firebase-config.js';
import { getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// State
let products = [];
let currentPage = 'dashboard';
let editingId = null;

// DOM Elements
let modal;
let productForm;
let productsTableBody;
let totalProductsSpan;
let totalRevenueSpan;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    modal = document.getElementById('productModal');
    productForm = document.getElementById('productForm');
    productsTableBody = document.getElementById('adminProductsList');
    totalProductsSpan = document.getElementById('totalProducts');
    totalRevenueSpan = document.getElementById('totalRevenue');
    
    setupEventListeners();
    loadProducts();
    loadDashboardStats();
});

async function loadProducts() {
    try {
        const q = query(productsCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        renderProductsTable();
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products', 'error');
    }
}

function renderProductsTable() {
    if (!productsTableBody) return;
    
    const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilterAdmin')?.value || '';
    
    let filtered = products;
    if (searchTerm) {
        filtered = filtered.filter(p => p.name?.toLowerCase().includes(searchTerm));
    }
    if (categoryFilter) {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    productsTableBody.innerHTML = filtered.map(product => `
        <tr>
            <td><img src="${product.imageUrl || 'https://via.placeholder.com/50'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
            <td><strong>${product.name || 'Unnamed'}</strong></td>
            <td><span class="category-badge">${product.category || 'Uncategorized'}</span></td>
            <td>Rp ${formatPrice(product.price || 0)}</td>
            <td><span class="stock-badge ${(product.stock || 0) > 0 ? 'in-stock' : 'out-stock'}">${product.stock || 0} units</span></td>
            <td>
                <button class="action-btn edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    // Attach edit/delete handlers
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editProduct(btn.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
}

async function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productImage').value = product.imageUrl || '';
    document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('productDescription').value = product.description || '';
    
    modal.style.display = 'flex';
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        await deleteDoc(doc(db, 'products', id));
        showNotification('Product deleted successfully', 'success');
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Failed to delete product', 'error');
    }
}

productForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        price: parseInt(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        imageUrl: document.getElementById('productImage').value,
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value,
        updatedAt: new Date().toISOString()
    };
    
    try {
        if (editingId) {
            await updateDoc(doc(db, 'products', editingId), productData);
            showNotification('Product updated successfully', 'success');
        } else {
            await addDoc(productsCollection, {
                ...productData,
                createdAt: new Date().toISOString()
            });
            showNotification('Product added successfully', 'success');
        }
        
        closeModal();
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Failed to save product', 'error');
    }
});

function closeModal() {
    modal.style.display = 'none';
    editingId = null;
    productForm.reset();
    document.getElementById('modalTitle').textContent = 'Add New Product';
}

async function loadDashboardStats() {
    try {
        const querySnapshot = await getDocs(productsCollection);
        const total = querySnapshot.size;
        const revenue = querySnapshot.docs.reduce((sum, doc) => {
            const price = doc.data().price || 0;
            return sum + price;
        }, 0);
        
        if (totalProductsSpan) totalProductsSpan.textContent = total;
        if (totalRevenueSpan) totalRevenueSpan.textContent = `Rp ${formatPrice(revenue)}`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateDashboardStats() {
    if (totalProductsSpan) totalProductsSpan.textContent = products.length;
    const totalRevenue = products.reduce((sum, p) => sum + (p.price || 0), 0);
    if (totalRevenueSpan) totalRevenueSpan.textContent = `Rp ${formatPrice(totalRevenue)}`;
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 100);
}

function setupEventListeners() {
    // Page navigation
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            switchPage(page);
        });
    });
    
    // Add product button
    const addBtn = document.getElementById('addProductBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            editingId = null;
            productForm.reset();
            document.getElementById('modalTitle').textContent = 'Add New Product';
            modal.style.display = 'flex';
        });
    }
    
    // Modal close
    document.querySelectorAll('.modal-close, #cancelBtn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Search and filter
    const productSearch = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('categoryFilterAdmin');
    
    if (productSearch) productSearch.addEventListener('input', () => renderProductsTable());
    if (categoryFilter) categoryFilter.addEventListener('change', () => renderProductsTable());
    
    // Sidebar toggle
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
}

function switchPage(page) {
    currentPage = page;
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Show/hide pages
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.toggle('active', content.id === `${page}Page`);
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});
