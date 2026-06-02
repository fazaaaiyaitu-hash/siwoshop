import { db, productsCollection } from './firebase-config.js';
import { getDocs, query, where, orderBy, limit, startAfter, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// State Management
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = '';
let currentSort = 'default';
let currentPriceRange = 10000000;
let currentSearchTerm = '';
let lastDoc = null;
let isLoading = false;
let hasMore = true;

// DOM Elements
let productContainer;
let loadingOverlay;
let cartSidebar;
let cartOverlay;
let toast;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    productContainer = document.getElementById('productContainer');
    loadingOverlay = document.getElementById('loadingOverlay');
    cartSidebar = document.getElementById('cartSidebar');
    cartOverlay = document.getElementById('cartOverlay');
    toast = document.getElementById('toastNotification');
    
    // Hide loading after 1s
    setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }, 1000);
    
    loadProducts();
    setupEventListeners();
    updateCartUI();
});

async function loadProducts(reset = true) {
    if (isLoading) return;
    isLoading = true;
    
    if (reset) {
        lastDoc = null;
        hasMore = true;
        allProducts = [];
        productContainer.innerHTML = '';
    }
    
    try {
        let q = query(productsCollection, limit(12));
        
        if (currentCategory) {
            q = query(q, where("category", "==", currentCategory));
        }
        
        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            hasMore = false;
        } else {
            lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            querySnapshot.forEach((doc) => {
                allProducts.push({ id: doc.id, ...doc.data() });
            });
        }
        
        applyFiltersAndSort();
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    } finally {
        isLoading = false;
    }
}

function applyFiltersAndSort() {
    let products = [...allProducts];
    
    // Apply search
    if (currentSearchTerm) {
        products = products.filter(p => 
            p.name?.toLowerCase().includes(currentSearchTerm.toLowerCase())
        );
    }
    
    // Apply price range
    products = products.filter(p => p.price <= currentPriceRange);
    
    // Apply sort
    switch(currentSort) {
        case 'price-asc':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            products.sort((a, b) => a.name?.localeCompare(b.name));
            break;
        default:
            // Keep original order
            break;
    }
    
    filteredProducts = products;
    displayProducts();
}

function displayProducts() {
    if (!productContainer) return;
    
    if (filteredProducts.length === 0) {
        productContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search term</p>
            </div>
        `;
        return;
    }
    
    const currentView = localStorage.getItem('productView') || 'grid';
    productContainer.className = currentView === 'grid' ? 'product-grid-view' : 'product-list-view';
    
    productContainer.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-badge">${getRandomBadge()}</div>
            <div class="product-image">
                <img src="${product.imageUrl || 'https://via.placeholder.com/300'}" alt="${product.name}" loading="lazy">
                <div class="product-actions">
                    <button class="action-btn add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="action-btn wishlist-btn" data-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3>${product.name || 'Product Name'}</h3>
                <div class="product-category">${product.category || 'Uncategorized'}</div>
                <div class="product-price">Rp ${formatPrice(product.price || 0)}</div>
            </div>
        </div>
    `).join('');
    
    // Attach event listeners to new buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const product = filteredProducts.find(p => p.id === id);
            if (product) addToCart(product);
        });
    });
}

function getRandomBadge() {
    const badges = ['Best Seller', 'New Arrival', 'Limited', 'Sale'];
    return badges[Math.floor(Math.random() * badges.length)];
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.imageUrl,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`${product.name} added to cart!`, 'success');
    animateCartIcon();
}

function updateCartUI() {
    const cartBadge = document.getElementById('cartBadge');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) cartBadge.textContent = totalItems;
    
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">Rp ${formatPrice(item.price)}</div>
                        <div class="cart-item-quantity">
                            <button class="qty-btn" data-id="${item.id}" data-change="-1">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" data-id="${item.id}" data-change="1">+</button>
                        </div>
                    </div>
                    <i class="fas fa-trash cart-item-remove" data-id="${item.id}"></i>
                </div>
            `).join('');
            
            // Attach quantity handlers
            document.querySelectorAll('.qty-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.dataset.id;
                    const change = parseInt(btn.dataset.change);
                    updateQuantity(id, change);
                });
            });
            
            document.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.dataset.id;
                    removeFromCart(id);
                });
            });
        }
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotalSpan) cartTotalSpan.textContent = `Rp ${formatPrice(total)}`;
}

function updateQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showToast('Item removed from cart', 'success');
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function animateCartIcon() {
    const cartIcon = document.querySelector('.nav-icon:first-child i');
    if (cartIcon) {
        cartIcon.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cartIcon.style.transform = 'scale(1)';
        }, 300);
    }
}

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            applyFiltersAndSort();
        });
    }
    
    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFiltersAndSort();
        });
    }
    
    // Price range
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            currentPriceRange = parseInt(e.target.value);
            priceValue.textContent = currentPriceRange === 10000000 ? 'All prices' : `Up to Rp ${formatPrice(currentPriceRange)}`;
            applyFiltersAndSort();
        });
    }
    
    // Category filters
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            currentCategory = card.dataset.category;
            allProducts = [];
            loadProducts(true);
        });
    });
    
    // View toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.dataset.view;
            localStorage.setItem('productView', view);
            displayProducts();
        });
    });
    
    // Cart drawer
    const cartBtn = document.getElementById('cartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('active');
        });
    }
    
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('active');
        });
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('active');
        });
    }
    
    // Load more
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            if (hasMore && !isLoading) {
                loadProducts(false);
            }
        });
    }
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}
