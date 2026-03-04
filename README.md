# CampusMart 🎓🛒

> **A modern peer-to-peer campus marketplace** — buy and sell anything with fellow students. No shipping. No platform fees. Just campus.

![CampusMart Banner](screenshots/banner.png)

---

## ✨ Overview

CampusMart is a full-stack peer-to-peer marketplace built specifically for campus communities. This repository contains the **frontend UI** — a modern SaaS-style interface built with pure HTML, CSS, and JavaScript, designed to connect seamlessly with the existing MERN backend.

**Design inspiration:** Linear.app · Vercel Dashboard · Notion

---

## 🎨 Design Highlights

| Feature | Detail |
|---|---|
| **Theme** | Dark-first with full light mode support |
| **Typography** | Syne (display) + DM Sans (body) — Google Fonts |
| **Color accent** | Electric Indigo `#6366f1` with Amber + Emerald supporting accents |
| **Animations** | CSS spring easing, orb float, card stagger, shimmer skeletons |
| **Layout** | Sidebar dashboard + responsive landing page |
| **UI style** | Glassmorphism cards, soft shadows, gradient accents |

---

## 🚀 Features

### Landing Page
- Animated hero section with floating product cards and gradient orbs
- Live statistics bar (listings, sellers, fees)
- Features grid with icon cards
- Step-by-step "How it works" section
- Category browser with hover animations
- Full-width CTA section
- Responsive footer
- Scroll-triggered navbar blur effect

### Authentication
- Slide-up modal login & signup forms
- Client-side validation with inline error messages
- JWT token stored in `localStorage`
- Auto-login on page reload if token is valid
- Password visibility toggle

### Dashboard
- Fixed sidebar with navigation, user info, and theme toggle
- Sticky topbar with global search + keyboard shortcut (`⌘K` / `Ctrl+K`)
- **Marketplace** — full product grid with real-time API data
- **My Listings** — seller's own products with delete action
- **Saved Items** — wishlist persisted in `localStorage`
- **Profile** — user info and stats

### Product Cards
- Lazy-loaded product images with graceful fallback
- Category badge with emoji
- Seller avatar + name
- Heart/wishlist button (appears on hover)
- Staggered appear animation

### Product Detail Drawer
- Right-side slide-in panel
- Full image, description, category, price
- Seller info card
- Direct "Contact Seller" email link

### Search & Filters
- Debounced text search (350ms)
- Category filter chips
- Sort by: Newest / Price Low→High / Price High→Low
- Stats bar (total listings, active filter)
- Server-side pagination

### UX Polish
- Loading skeletons with shimmer animation
- Empty states with contextual messages
- Toast notification system (success / error)
- Drag-and-drop image upload in Add Product form
- Dark/light theme toggle with persistence
- Fully keyboard accessible (`Tab`, `Escape`, `⌘K`)
- Mobile-responsive sidebar with overlay

---

## 📁 Folder Structure

```
campusmart-frontend/
├── index.html          # Full HTML — landing + dashboard
├── style.css           # Design system + all styles
├── script.js           # Logic, API calls, UI interactions
├── README.md           # This file
└── screenshots/
    ├── banner.png
    ├── landing.png
    ├── dashboard.png
    ├── product-card.png
    └── mobile.png
```

---

## ⚙️ How to Run the Frontend

### Option A — Open directly (zero setup)

```bash
# No server needed for basic viewing
open index.html
```

> ⚠️ For API calls to work you'll need either a local server (Option B) or CORS configured on your backend.

### Option B — Local dev server (recommended)

**Using VS Code Live Server:**
1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `index.html` → **Open with Live Server**

**Using Python:**
```bash
# Python 3
python -m http.server 3000

# Then open http://localhost:3000
```

**Using Node.js (`serve`):**
```bash
npx serve .
# Then open the printed URL
```

---

## 🔌 Connecting to the Backend

### 1. Set the API base URL

Open `script.js` and update line 15:

```js
const API_BASE = 'http://localhost:5000/api';
// Change to your actual backend URL, e.g.:
// const API_BASE = 'https://campusmart-api.onrender.com/api';
```

### 2. API Endpoints used

| Action | Method | Endpoint |
|---|---|---|
| Login | `POST` | `/api/auth/login` |
| Register | `POST` | `/api/auth/register` |
| Get current user | `GET` | `/api/auth/me` |
| Get all products | `GET` | `/api/products` |
| Get my products | `GET` | `/api/products/me` |
| Create product | `POST` | `/api/products` (multipart/form-data) |
| Delete product | `DELETE` | `/api/products/:id` |

If your backend uses different route names, update the `ENDPOINTS` object in `script.js`:

```js
const ENDPOINTS = {
  LOGIN:       `${API_BASE}/auth/login`,
  SIGNUP:      `${API_BASE}/auth/register`,
  ME:          `${API_BASE}/auth/me`,
  PRODUCTS:    `${API_BASE}/products`,
  MY_PRODUCTS: `${API_BASE}/products/me`,
  UPLOAD:      `${API_BASE}/products`,
};
```

### 3. Expected response shapes

**Login / Register:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "_id": "64abc...",
    "name": "Rohan Mehta",
    "email": "rohan@campus.edu"
  }
}
```

**Products list:**
```json
{
  "products": [...],
  "total": 42
}
```

**Single product object:**
```json
{
  "_id": "64abc...",
  "title": "Engineering Textbook",
  "price": 350,
  "category": "books",
  "description": "Great condition...",
  "image": "https://...",
  "seller": {
    "name": "Rohan Mehta",
    "email": "rohan@campus.edu"
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

> 💡 The frontend adapts to common field name variations (e.g. `products` vs `data`, `_id` vs `id`). Adjust the mapping in `loadProducts()` if your backend differs.

### 4. CORS

Make sure your Express backend allows requests from your frontend's origin:

```js
// In your Express app.js / server.js
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],
  credentials: true,
}));
```

---

## 🖼️ Screenshots

| Page | Preview |
|---|---|
| Landing Hero | `screenshots/landing.png` |
| Dashboard | `screenshots/dashboard.png` |
| Product Cards | `screenshots/product-card.png` |
| Mobile View | `screenshots/mobile.png` |

*(Add your own screenshots to the `screenshots/` folder)*

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Markup | Semantic HTML5 |
| Styles | Pure CSS3 (Custom Properties, Grid, Flexbox, Animations) |
| Logic | Vanilla JavaScript ES2022 (async/await, modules) |
| Icons | [Feather Icons](https://feathericons.com/) (CDN) |
| Fonts | [Google Fonts](https://fonts.google.com/) — Syne + DM Sans |
| Auth | JWT stored in `localStorage` |
| State | In-memory JS object + `localStorage` for theme/wishlist |

**No frameworks. No build step. No npm required.** Just three files.

---

## 🎨 Theme Customization

All colors are defined as CSS custom properties in `style.css`. To change the accent color:

```css
:root {
  --accent-indigo: #6366f1;        /* Primary accent */
  --accent-indigo-light: #818cf8;  /* Light variant */
  --gradient-primary: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
}
```

To add a third theme or change the dark theme background:

```css
[data-theme="dark"] {
  --bg-base: #08090d;    /* Page background */
  --bg-surface: #0f1117; /* Cards + sidebar */
  --bg-elevated: #161823;/* Modals + elevated elements */
}
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `> 1100px` | Floating hero cards visible |
| `900px–1100px` | Sidebar fixed, hero cards hidden |
| `< 900px` | Sidebar becomes a mobile drawer |
| `< 768px` | Mobile nav, stacked layouts |
| `< 480px` | 2-column product grid |

---

## 🔮 Future Enhancements

- [ ] Real-time chat / messaging between buyer and seller
- [ ] Google / GitHub OAuth login
- [ ] Product image carousel in detail drawer
- [ ] Rating & review system for sellers
- [ ] Notification bell with unread count
- [ ] Advanced filters (price range slider, date posted)
- [ ] "Bump" listing to top feature
- [ ] PWA support (offline, installable)

---

## 📄 License

MIT License — free to use and modify for personal or educational projects.

---

**Made with ♥ for campus communities.**
