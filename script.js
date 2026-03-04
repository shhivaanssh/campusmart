/* ============================================================
   CAMPUSMART — FRONTEND LOGIC
   Pure JavaScript | API-connected | Dark mode | Search + Filters
   ============================================================ */

'use strict';

/* ============================================================
   1. CONFIGURATION
   ============================================================ */

/**
 * Base URL for your Express/Node.js backend.
 * Change this to match your actual API server address.
 * e.g. "https://api.campusmart.example.com" for production
 */
const API_BASE = 'http://localhost:5000/api';

/** API endpoints (adjust paths to match your actual backend routes) */
const ENDPOINTS = {
  LOGIN:       `${API_BASE}/auth/login`,
  SIGNUP:      `${API_BASE}/auth/register`,
  ME:          `${API_BASE}/auth/me`,
  PRODUCTS:    `${API_BASE}/products`,
  MY_PRODUCTS: `${API_BASE}/products/me`,   // or `/api/products?seller=me`
  UPLOAD:      `${API_BASE}/products`,       // POST with multipart/form-data
};

/* ============================================================
   2. APP STATE
   ============================================================ */
const State = {
  token:          null,
  user:           null,
  products:       [],
  filteredProducts: [],
  myProducts:     [],
  wishlist:       [],          // saved product IDs (localStorage)
  currentCategory:'all',
  currentSort:    'newest',
  searchQuery:    '',
  currentPage:    1,
  perPage:        12,
  totalProducts:  0,
};

/* ============================================================
   3. UTILITIES
   ============================================================ */

/** Fetch JSON from a URL with optional auth header */
async function apiFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (State.token) headers['Authorization'] = `Bearer ${State.token}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}

/** Multipart form-data fetch (for image upload) */
async function apiFormFetch(url, formData) {
  const headers = {};
  if (State.token) headers['Authorization'] = `Bearer ${State.token}`;
  const res = await fetch(url, { method: 'POST', headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}

/** Show/hide elements */
const show = (id) => document.getElementById(id)?.classList.remove('hidden');
const hide = (id) => document.getElementById(id)?.classList.add('hidden');
const el   = (id) => document.getElementById(id);

/** Escape HTML to prevent XSS */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Format currency */
function formatPrice(price) {
  return '₹' + Number(price).toLocaleString('en-IN');
}

/** Get category emoji */
function catEmoji(cat) {
  const map = {
    books: '📚', electronics: '💻', clothing: '👕', furniture: '🛋',
    sports: '⚽', stationery: '✏️', food: '☕', other: '📦',
  };
  return map[cat] || '📦';
}

/** Get initials from a name */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ============================================================
   4. TOAST NOTIFICATIONS
   ============================================================ */
let _toastTimer;

/**
 * @param {string} msg   - Message text
 * @param {'success'|'error'|''} type - Toast type
 * @param {number} duration - ms before auto-hide
 */
function showToast(msg, type = '', duration = 3200) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

/* ============================================================
   5. MODAL SYSTEM
   ============================================================ */

/**
 * @param {'login'|'signup'|'modal-add-product'} which
 */
function openModal(which) {
  show('modal-overlay');
  el('modal-overlay').classList.remove('hidden');

  // hide all modal cards first
  ['modal-login', 'modal-signup', 'modal-add-product'].forEach(id => hide(id));

  if (which === 'login')             show('modal-login');
  else if (which === 'signup')       show('modal-signup');
  else if (which === 'modal-add-product') show('modal-add-product');

  // Re-init feather icons inside modal
  feather.replace();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  hide('modal-overlay');
  document.body.style.overflow = '';
}

function switchModal(to) {
  openModal(to);
}

/** Require login before opening a modal */
function requireAuth(modalId) {
  if (!State.token) {
    openModal('login');
    showToast('Please sign in first', 'error');
    return;
  }
  openModal(modalId);
}

// Close modal on overlay click
el('modal-overlay')?.addEventListener('click', (e) => {
  if (e.target === el('modal-overlay')) closeModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDrawer();
  }
  // ⌘K / Ctrl+K focus search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    el('search-input')?.focus();
  }
});

/* ============================================================
   6. PASSWORD TOGGLE
   ============================================================ */
function togglePassword(inputId) {
  const input = el(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

/* ============================================================
   7. THEME TOGGLE
   ============================================================ */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cm_theme', next);
  feather.replace();
}

function applyStoredTheme() {
  const saved = localStorage.getItem('cm_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
}

/* ============================================================
   8. AUTH — LOGIN
   ============================================================ */
el('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = el('login-email').value.trim();
  const password = el('login-password').value;
  const errEl    = el('login-error');
  const btn      = el('btn-login-submit');

  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    show('login-error');
    return;
  }

  hide('login-error');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Signing in…';

  try {
    const data = await apiFetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Backend should return { token, user } or { token }
    State.token = data.token;
    State.user  = data.user || null;
    localStorage.setItem('cm_token', data.token);
    if (data.user) localStorage.setItem('cm_user', JSON.stringify(data.user));

    closeModal();
    showToast('Welcome back! 👋', 'success');
    await initDashboard();
  } catch (err) {
    errEl.textContent = err.message || 'Login failed. Please try again.';
    show('login-error');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Sign in';
  }
});

/* ============================================================
   9. AUTH — SIGNUP
   ============================================================ */
el('form-signup')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const firstName = el('signup-firstname').value.trim();
  const lastName  = el('signup-lastname').value.trim();
  const email     = el('signup-email').value.trim();
  const password  = el('signup-password').value;
  const errEl     = el('signup-error');
  const btn       = el('btn-signup-submit');

  if (!firstName || !email || !password) {
    errEl.textContent = 'Please fill in all required fields.';
    show('signup-error');
    return;
  }

  if (password.length < 8) {
    errEl.textContent = 'Password must be at least 8 characters.';
    show('signup-error');
    return;
  }

  hide('signup-error');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Creating account…';

  try {
    const data = await apiFetch(ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify({
        name:     `${firstName} ${lastName}`.trim(),
        // Some backends also accept firstName + lastName separately:
        firstName,
        lastName,
        email,
        password,
      }),
    });

    State.token = data.token;
    State.user  = data.user || null;
    localStorage.setItem('cm_token', data.token);
    if (data.user) localStorage.setItem('cm_user', JSON.stringify(data.user));

    closeModal();
    showToast('Account created! Welcome to CampusMart 🎉', 'success');
    await initDashboard();
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed. Please try again.';
    show('signup-error');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Create account';
  }
});

/* ============================================================
   10. AUTH — LOGOUT
   ============================================================ */
function handleLogout() {
  State.token = null;
  State.user  = null;
  localStorage.removeItem('cm_token');
  localStorage.removeItem('cm_user');
  showLanding();
  showToast('You have been signed out', '');
}

/* ============================================================
   11. FETCH CURRENT USER (from token)
   ============================================================ */
async function fetchCurrentUser() {
  try {
    const data = await apiFetch(ENDPOINTS.ME);
    // API may return { user } or the user object directly
    State.user = data.user || data;
    localStorage.setItem('cm_user', JSON.stringify(State.user));
  } catch {
    // Token expired or invalid
    handleLogout();
    throw new Error('Session expired');
  }
}

/* ============================================================
   12. PAGE NAVIGATION
   ============================================================ */
function showLanding() {
  show('page-landing');
  hide('page-dashboard');
  feather.replace();
  initLandingScrollEffect();
}

async function initDashboard() {
  hide('page-landing');
  show('page-dashboard');

  // Resolve user info
  if (!State.user) {
    const cached = localStorage.getItem('cm_user');
    if (cached) {
      try { State.user = JSON.parse(cached); } catch {}
    }
    if (!State.user) {
      try { await fetchCurrentUser(); } catch { return; }
    }
  }

  populateUserUI();
  feather.replace();
  loadWishlist();
  await loadProducts();
}

function populateUserUI() {
  const u = State.user;
  if (!u) return;
  const name   = u.name || u.firstName || u.username || 'User';
  const email  = u.email || '';
  const initials = getInitials(name);

  // Sidebar
  if (el('sidebar-name'))   el('sidebar-name').textContent   = name;
  if (el('sidebar-email'))  el('sidebar-email').textContent  = email;
  if (el('sidebar-avatar')) el('sidebar-avatar').textContent = initials;

  // Topbar
  if (el('topbar-avatar')) el('topbar-avatar').textContent = initials;

  // Profile section
  if (el('profile-name'))   el('profile-name').textContent   = name;
  if (el('profile-email'))  el('profile-email').textContent  = email;
  if (el('profile-avatar')) el('profile-avatar').textContent = initials;
}

function resetDashboard() {
  switchSection('marketplace', document.querySelector('[data-section="marketplace"]'));
}

/* ============================================================
   13. SIDEBAR NAVIGATION
   ============================================================ */
function switchSection(section, linkEl) {
  // Deactivate all links
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');

  // Hide all sections
  ['section-marketplace', 'section-my-listings', 'section-wishlist', 'section-profile']
    .forEach(id => hide(id));

  // Show target section
  show(`section-${section}`);

  // Load section data if needed
  if (section === 'my-listings') loadMyListings();
  if (section === 'wishlist')    renderWishlist();
  if (section === 'profile')     updateProfileStats();

  // On mobile close sidebar
  closeSidebar();

  feather.replace();
  return false; // prevent anchor navigation
}

function openSidebar() {
  el('sidebar')?.classList.add('open');
  el('sidebar-overlay')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  el('sidebar')?.classList.remove('open');
  el('sidebar-overlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ============================================================
   14. LOAD PRODUCTS (Marketplace)
   ============================================================ */
async function loadProducts() {
  showSkeletons();

  try {
    // Build query string
    const params = new URLSearchParams();
    if (State.searchQuery)                    params.set('search', State.searchQuery);
    if (State.currentCategory !== 'all')      params.set('category', State.currentCategory);
    if (State.currentSort === 'price-asc')    params.set('sort', 'price');
    if (State.currentSort === 'price-desc')   params.set('sort', '-price');
    if (State.currentSort === 'newest')       params.set('sort', '-createdAt');
    params.set('page',  State.currentPage);
    params.set('limit', State.perPage);

    const data = await apiFetch(`${ENDPOINTS.PRODUCTS}?${params}`);

    // Backend may return { products, total } or { data, count } — adapt as needed
    State.products       = data.products || data.data || data || [];
    State.totalProducts  = data.total    || data.count || State.products.length;
    State.filteredProducts = State.products;

  } catch (err) {
    // Fall back to demo data when backend is not running
    console.warn('API unavailable, using demo data:', err.message);
    State.products = getDemoProducts();
    State.filteredProducts = State.products;
    State.totalProducts = State.products.length;
  }

  hideSkeletons();
  renderProducts();
  updateStats();
  renderPagination();
}

function showSkeletons() {
  el('product-skeleton')?.classList.remove('hidden');
  el('product-grid')?.classList.add('hidden');
  hide('empty-state');
  hide('pagination');
}

function hideSkeletons() {
  el('product-skeleton')?.classList.add('hidden');
  el('product-grid')?.classList.remove('hidden');
}

/* ============================================================
   15. RENDER PRODUCTS
   ============================================================ */
function renderProducts() {
  const grid = el('product-grid');
  if (!grid) return;

  const products = State.filteredProducts;

  if (!products.length) {
    grid.innerHTML = '';
    show('empty-state');
    return;
  }

  hide('empty-state');
  grid.innerHTML = products.map((p, i) => productCardHTML(p, i, false)).join('');
  feather.replace();
}

function productCardHTML(p, index, showActions) {
  const id          = p._id || p.id;
  const title       = escHtml(p.title || p.name || 'Untitled');
  const price       = formatPrice(p.price || 0);
  const category    = escHtml(p.category || 'other');
  const desc        = escHtml(p.description || '');
  const imageUrl    = p.image || p.imageUrl || p.images?.[0] || '';
  const sellerName  = p.seller?.name || p.sellerName || 'Campus Seller';
  const sellerInit  = getInitials(sellerName);
  const isWishlisted = State.wishlist.includes(id);
  const delay       = Math.min(index * 0.04, 0.4);

  return `
    <div
      class="product-card"
      role="listitem"
      style="animation-delay:${delay}s"
      onclick="openProductDrawer('${id}')"
    >
      <div class="card-image-wrap">
        ${imageUrl
          ? `<img class="card-image" src="${escHtml(imageUrl)}" alt="${title}" loading="lazy"
               onerror="this.parentElement.innerHTML='<div class=\\'card-image-placeholder\\'><i data-feather=\\'image\\'></i></div>';feather.replace();">`
          : `<div class="card-image-placeholder"><i data-feather="image"></i></div>`
        }
        <span class="card-category-badge">${catEmoji(category)} ${category}</span>
        <button
          class="card-wishlist-btn ${isWishlisted ? 'active' : ''}"
          onclick="event.stopPropagation(); toggleWishlist('${id}', this)"
          aria-label="${isWishlisted ? 'Remove from saved' : 'Save item'}"
          title="${isWishlisted ? 'Remove from saved' : 'Save item'}"
        >
          <i data-feather="heart"></i>
        </button>
      </div>
      <div class="card-body">
        <h3 class="card-title">${title}</h3>
        ${desc ? `<p class="card-desc">${desc}</p>` : ''}
        <div class="card-footer">
          <span class="card-price">${price}</span>
          <div class="card-seller">
            <div class="seller-avatar">${sellerInit}</div>
            ${escHtml(sellerName)}
          </div>
        </div>
      </div>
      ${showActions ? `
      <div class="card-actions">
        <button class="btn-card-action btn-card-delete"
          onclick="event.stopPropagation(); deleteProduct('${id}')">
          <i data-feather="trash-2"></i> Delete
        </button>
      </div>` : ''}
    </div>
  `;
}

/* ============================================================
   16. SEARCH
   ============================================================ */
let _searchDebounce;

el('search-input')?.addEventListener('input', (e) => {
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => {
    State.searchQuery  = e.target.value.trim();
    State.currentPage  = 1;
    loadProducts();
  }, 350);
});

/* ============================================================
   17. FILTERS & SORT
   ============================================================ */
function filterByCategory(cat, btn) {
  State.currentCategory = cat;
  State.currentPage = 1;

  // Update active chip
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn?.classList.add('active');

  loadProducts();
}

function handleSort(value) {
  State.currentSort = value;
  State.currentPage = 1;
  loadProducts();
}

/* ============================================================
   18. STATS BAR
   ============================================================ */
function updateStats() {
  const totalEl    = el('stat-total');
  const filteredEl = el('stat-filtered');
  if (totalEl)    totalEl.textContent    = `${State.totalProducts} listing${State.totalProducts !== 1 ? 's' : ''}`;
  if (filteredEl) filteredEl.textContent = State.currentCategory !== 'all'
    ? `Filtered: ${State.currentCategory}` : 'Showing all';
}

/* ============================================================
   19. PAGINATION
   ============================================================ */
function renderPagination() {
  const container = el('pagination');
  if (!container) return;

  const totalPages = Math.ceil(State.totalProducts / State.perPage);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  show('pagination');
  let html = '';

  // Prev button
  html += `
    <button class="page-btn" onclick="goToPage(${State.currentPage - 1})"
      ${State.currentPage === 1 ? 'disabled style="opacity:0.4;pointer-events:none"' : ''}>
      <i data-feather="chevron-left"></i>
    </button>`;

  // Page numbers (show max 7)
  const start = Math.max(1, State.currentPage - 3);
  const end   = Math.min(totalPages, start + 6);

  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === State.currentPage ? 'active' : ''}"
      onclick="goToPage(${i})">${i}</button>`;
  }

  // Next button
  html += `
    <button class="page-btn" onclick="goToPage(${State.currentPage + 1})"
      ${State.currentPage === totalPages ? 'disabled style="opacity:0.4;pointer-events:none"' : ''}>
      <i data-feather="chevron-right"></i>
    </button>`;

  container.innerHTML = html;
  feather.replace();
}

function goToPage(page) {
  const totalPages = Math.ceil(State.totalProducts / State.perPage);
  if (page < 1 || page > totalPages) return;
  State.currentPage = page;
  loadProducts();
  // Scroll to top of product grid
  el('section-marketplace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   20. MY LISTINGS
   ============================================================ */
async function loadMyListings() {
  const grid    = el('my-product-grid');
  const emptyEl = el('my-empty-state');
  if (!grid) return;

  grid.innerHTML = '<div class="product-skeleton"></div>'.repeat(4);
  hide('my-empty-state');

  try {
    const data = await apiFetch(ENDPOINTS.MY_PRODUCTS);
    State.myProducts = data.products || data.data || data || [];
  } catch {
    State.myProducts = getDemoProducts().slice(0, 3);
  }

  if (!State.myProducts.length) {
    grid.innerHTML = '';
    show('my-empty-state');
    feather.replace();

    // Update profile listing count
    if (el('profile-listing-count')) el('profile-listing-count').textContent = 0;
    return;
  }

  grid.innerHTML = State.myProducts.map((p, i) => productCardHTML(p, i, true)).join('');
  feather.replace();

  if (el('profile-listing-count'))
    el('profile-listing-count').textContent = State.myProducts.length;
}

/* ============================================================
   21. DELETE PRODUCT
   ============================================================ */
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this listing?')) return;

  try {
    await apiFetch(`${ENDPOINTS.PRODUCTS}/${productId}`, { method: 'DELETE' });
    showToast('Listing deleted', 'success');
    await loadMyListings();
    await loadProducts();
  } catch (err) {
    showToast(err.message || 'Failed to delete listing', 'error');
  }
}

/* ============================================================
   22. ADD PRODUCT
   ============================================================ */

// Image preview
el('product-image')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (r) => {
    el('image-preview').src = r.target.result;
    show('image-preview-wrap');
    el('file-drop-zone').classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

// Drag & drop on file zone
el('file-drop-zone')?.addEventListener('dragover', (e) => {
  e.preventDefault();
  el('file-drop-zone').classList.add('drag-over');
});

el('file-drop-zone')?.addEventListener('dragleave', () => {
  el('file-drop-zone').classList.remove('drag-over');
});

el('file-drop-zone')?.addEventListener('drop', (e) => {
  e.preventDefault();
  el('file-drop-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    el('product-image').files = dt.files;
    el('product-image').dispatchEvent(new Event('change'));
  }
});

function clearImagePreview() {
  el('image-preview').src = '';
  hide('image-preview-wrap');
  el('file-drop-zone').classList.remove('hidden');
  el('product-image').value = '';
}

el('form-add-product')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn    = el('btn-product-submit');
  const errEl  = el('product-error');
  hide('product-error');

  const title       = el('product-title').value.trim();
  const price       = el('product-price').value.trim();
  const category    = el('product-category').value;
  const description = el('product-description').value.trim();
  const imageFile   = el('product-image').files?.[0];

  if (!title || !price || !category || !description) {
    errEl.textContent = 'Please fill in all required fields.';
    show('product-error');
    return;
  }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Posting…';

  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('description', description);
    if (imageFile) formData.append('image', imageFile);

    await apiFormFetch(ENDPOINTS.UPLOAD, formData);

    closeModal();
    showToast('Listing posted successfully! 🎉', 'success');

    // Refresh data
    State.currentPage = 1;
    await loadProducts();
    await loadMyListings();

    // Reset form
    el('form-add-product').reset();
    clearImagePreview();

  } catch (err) {
    errEl.textContent = err.message || 'Failed to post listing.';
    show('product-error');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Post Listing';
  }
});

/* ============================================================
   23. PRODUCT DETAIL DRAWER
   ============================================================ */
function openProductDrawer(productId) {
  const product = [...State.products, ...State.myProducts].find(
    p => (p._id || p.id) === productId
  );

  if (!product) return;

  const drawer = el('product-drawer');
  const content = el('drawer-content');
  if (!drawer || !content) return;

  const title      = escHtml(product.title || product.name || 'Untitled');
  const price      = formatPrice(product.price || 0);
  const category   = escHtml(product.category || 'other');
  const desc       = escHtml(product.description || 'No description provided.');
  const imageUrl   = product.image || product.imageUrl || product.images?.[0] || '';
  const sellerName = product.seller?.name || product.sellerName || 'Campus Seller';
  const sellerInit = getInitials(sellerName);
  const sellerEmail= product.seller?.email || '';
  const postedDate = product.createdAt
    ? new Date(product.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : 'Recently';

  content.innerHTML = `
    <div class="drawer-image-wrap">
      ${imageUrl
        ? `<img src="${escHtml(imageUrl)}" alt="${title}"
             onerror="this.src=''; this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary)\\'><svg width=48 height=48><use href=\\''\\'/></svg></div>'">`
        : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary);font-size:14px;">No image</div>`
      }
    </div>
    <span class="drawer-category">${catEmoji(category)} ${category}</span>
    <h2 class="drawer-title">${title}</h2>
    <p class="drawer-price">${price}</p>
    <p class="drawer-desc">${desc}</p>
    <div class="drawer-seller-card">
      <div class="drawer-seller-avatar">${sellerInit}</div>
      <div class="drawer-seller-info">
        <p>${escHtml(sellerName)}</p>
        <p>${sellerEmail ? escHtml(sellerEmail) : 'Listed ' + postedDate}</p>
      </div>
    </div>
    <div class="drawer-actions">
      ${sellerEmail
        ? `<a href="mailto:${escHtml(sellerEmail)}?subject=CampusMart: ${encodeURIComponent(product.title || 'Product enquiry')}"
             class="btn-primary" style="flex:1;justify-content:center;text-decoration:none;">
             <i data-feather="mail"></i> Contact seller
           </a>`
        : `<button class="btn-primary" onclick="showToast('Contact feature coming soon!', '')" style="flex:1;justify-content:center;">
             <i data-feather="mail"></i> Contact seller
           </button>`
      }
      <button class="btn-ghost" onclick="toggleWishlist('${escHtml(productId)}', null)">
        <i data-feather="heart"></i>
      </button>
    </div>
  `;

  drawer.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  feather.replace();
}

function closeDrawer() {
  el('product-drawer')?.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ============================================================
   24. WISHLIST (saved items — localStorage)
   ============================================================ */
function loadWishlist() {
  try {
    State.wishlist = JSON.parse(localStorage.getItem('cm_wishlist') || '[]');
  } catch {
    State.wishlist = [];
  }
}

function saveWishlist() {
  localStorage.setItem('cm_wishlist', JSON.stringify(State.wishlist));
}

function toggleWishlist(productId, btn) {
  const idx = State.wishlist.indexOf(productId);
  if (idx > -1) {
    State.wishlist.splice(idx, 1);
    showToast('Removed from saved items', '');
    if (btn) btn.classList.remove('active');
  } else {
    State.wishlist.push(productId);
    showToast('Saved to wishlist ❤️', 'success');
    if (btn) btn.classList.add('active');
  }
  saveWishlist();
  updateProfileStats();
}

function renderWishlist() {
  const grid     = el('wishlist-grid');
  const emptyEl  = el('wishlist-empty-state');
  if (!grid) return;

  const saved = State.products.filter(p =>
    State.wishlist.includes(p._id || p.id)
  );

  if (!saved.length) {
    grid.innerHTML = '';
    show('wishlist-empty-state');
    feather.replace();
    return;
  }

  hide('wishlist-empty-state');
  grid.innerHTML = saved.map((p, i) => productCardHTML(p, i, false)).join('');
  feather.replace();
}

function updateProfileStats() {
  if (el('profile-saved-count'))
    el('profile-saved-count').textContent = State.wishlist.length;
}

/* ============================================================
   25. LANDING PAGE SCROLL EFFECT
   ============================================================ */
function initLandingScrollEffect() {
  const navbar = el('navbar');
  if (!navbar) return;
  const onScroll = () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else                     navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ============================================================
   26. MOBILE NAV TOGGLE
   ============================================================ */
function toggleMobileNav() {
  const links = el('nav-links');
  if (!links) return;
  links.classList.toggle('mobile-open');
  feather.replace();
}

// Close mobile nav on link click
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    el('nav-links')?.classList.remove('mobile-open');
  });
});

/* ============================================================
   27. DEMO DATA (fallback when API is unavailable)
   ============================================================ */
function getDemoProducts() {
  return [
    {
      _id: 'demo1',
      title: 'Engineering Mathematics – 4th Edition',
      price: 380,
      category: 'books',
      description: 'Excellent condition. All chapters intact, minimal highlighting. Great for 2nd year students.',
      seller: { name: 'Rohan Mehta', email: 'rohan@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      _id: 'demo2',
      title: 'Dell Inspiron 15 Laptop Bag',
      price: 550,
      category: 'electronics',
      description: 'Fits 15-inch laptops. Multiple compartments. Barely used, no scratches.',
      seller: { name: 'Priya Singh', email: 'priya@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      _id: 'demo3',
      title: 'Study Table with Drawer',
      price: 1800,
      category: 'furniture',
      description: 'Solid wood study table. Fits comfortably in hostel rooms. Height adjustable shelf included.',
      seller: { name: 'Aditya Kumar', email: 'aditya@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      _id: 'demo4',
      title: 'Sony WH-1000XM4 Headphones',
      price: 4500,
      category: 'electronics',
      description: 'Noise-cancelling, used for 6 months. Comes with carry case and original cable.',
      seller: { name: 'Neha Sharma', email: 'neha@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    },
    {
      _id: 'demo5',
      title: 'Cricket Kit – Complete Set',
      price: 2200,
      category: 'sports',
      description: 'Bat, pads, gloves, helmet. Used for one semester intramural league. Good condition.',
      seller: { name: 'Vikram Patel', email: 'vikram@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      _id: 'demo6',
      title: 'Casio FX-991ES Plus Calculator',
      price: 420,
      category: 'stationery',
      description: 'Scientific calculator. Perfect for engineering exams. No scratches, full battery.',
      seller: { name: 'Meera Joshi', email: 'meera@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    },
    {
      _id: 'demo7',
      title: 'Nike Running Shoes – Size 42',
      price: 1400,
      category: 'clothing',
      description: 'Black Nike Revolution 6. Used only a few times. Very comfortable for long runs.',
      seller: { name: 'Arjun Nair', email: 'arjun@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      _id: 'demo8',
      title: 'Data Structures & Algorithms Book',
      price: 320,
      category: 'books',
      description: 'Cormen\'s CLRS 3rd edition. Light pencil notes in first 5 chapters. Must-have for CSE.',
      seller: { name: 'Tanya Roy', email: 'tanya@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      _id: 'demo9',
      title: 'USB-C Hub 7-in-1',
      price: 750,
      category: 'electronics',
      description: 'HDMI, USB 3.0 ×3, SD card, ethernet. Works perfectly. Selling because upgraded.',
      seller: { name: 'Kabir Singh', email: 'kabir@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    },
    {
      _id: 'demo10',
      title: 'Bean Bag Chair – Navy Blue',
      price: 900,
      category: 'furniture',
      description: 'Extra-large bean bag. Great for reading or gaming. Needs a refill of beans.',
      seller: { name: 'Ishaan Desai', email: 'ishaan@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      _id: 'demo11',
      title: 'Yoga Mat + Resistance Bands',
      price: 480,
      category: 'sports',
      description: 'Thick non-slip yoga mat (6mm) plus a set of 5 resistance bands. Great for dorm workouts.',
      seller: { name: 'Simran Kaur', email: 'simran@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 3.5).toISOString(),
    },
    {
      _id: 'demo12',
      title: 'Graph Paper Notebooks × 5',
      price: 150,
      category: 'stationery',
      description: 'A4 size, 100 pages each. Brand new, sealed. Ideal for engineering drawing.',
      seller: { name: 'Dev Malhotra', email: 'dev@campus.edu' },
      createdAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
    },
  ];
}

/* ============================================================
   28. BOOT — INITIALISE THE APP
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Apply stored theme preference
  applyStoredTheme();

  // 2. Check for stored auth token
  const storedToken = localStorage.getItem('cm_token');
  const storedUser  = localStorage.getItem('cm_user');

  if (storedToken) {
    State.token = storedToken;
    if (storedUser) {
      try { State.user = JSON.parse(storedUser); } catch {}
    }
    // Try to init dashboard; falls back to landing if token invalid
    try {
      await initDashboard();
    } catch {
      showLanding();
    }
  } else {
    showLanding();
  }

  // 3. Init Feather Icons
  feather.replace();
});
