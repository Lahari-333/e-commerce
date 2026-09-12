# Shop Express

A production-ready, full-stack e-commerce web platform built with a high-performance **React + Vite** frontend, a secure **Node.js + Express** REST API, and a normalized **MySQL** relational database.

Shop Express delivers an end-to-end shopping experience featuring JWT-based authentication, real-time product discovery, persistent shopping cart, address book management, transaction-safe checkout with inventory deduction, customer wishlists, verified product reviews, and a complete role-protected administrative dashboard.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Project Architecture & Structure](#project-architecture--structure)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup Guide](#installation--setup-guide)
6. [Environment Variables](#environment-variables)
7. [REST API Reference](#rest-api-reference)
8. [Demo Accounts](#demo-accounts)
9. [Available Scripts](#available-scripts)
10. [Testing & Verification](#testing--verification)
11. [Security Best Practices](#security-best-practices)
12. [Production Deployment Guide](#production-deployment-guide)
13. [Future Enhancements](#future-enhancements)

---

## Key Features

### 🛍️ Customer Storefront & Shopping Experience
- **Product Discovery & Exploration:**
  - Full catalog browsing with server-side pagination (12 items/page default, clamped to max 50).
  - Multi-field keyword search matching product titles, descriptions, and summaries.
  - Category filtering by slug or ID with real-time counters.
  - Multi-criteria sorting: Relevance/Default, Newest, Price: Low to High, Price: High to Low, Name: A to Z, and Highest Rated.
  - Effective selling price range filtering (`COALESCE(discount_price, base_price)`) with custom min/max inputs and 4 quick presets (Under ₹500, ₹500–₹1,000, ₹1,000–₹2,500, Above ₹2,500).
  - Deep-link synchronization: search, filters, sorting, and pagination are fully mirrored in URL query strings.
- **Product Details & Variants:**
  - Multi-image gallery with primary photo highlight and thumbnail switcher.
  - Variant selection (e.g., Size, Color, Edition) with dynamic price modifier calculations.
  - Real-time stock status badges (In Stock, Low Stock, Out of Stock).
- **Persistent Shopping Cart:**
  - Database-persisted cart for authenticated customers across sessions and devices.
  - Support for variant-specific items and strict inventory availability checks.
  - Quantity controls with live line-item totals and free shipping threshold calculation.
- **Address Management & Safe Checkout:**
  - Customer address book supporting default shipping/billing addresses.
  - Multi-step order placement using database transactions (`START TRANSACTION` / `COMMIT` / `ROLLBACK`).
  - Row-level inventory locking (`FOR UPDATE`) preventing overselling under concurrent requests.
  - Instant stock deduction upon successful order placement.
  - Test Payment and Cash on Delivery (COD) order fulfillment options.
- **Customer Account & Orders:**
  - Order history with tracking status badges (Pending, Processing, Confirmed, Shipped, Delivered).
  - Comprehensive order details with itemized invoice snapshots, delivery address, and timeline.
- **Wishlist & Customer Reviews:**
  - One-click wishlist toggle from catalog cards or product details.
  - 1-to-5 star verified reviews with optional title and text.
  - Automatic aggregate calculation: average rating, total reviews count, and star distribution.

### 🛡️ Administrative Dashboard & Operations
- **Role-Based Access Control (RBAC):**
  - Dedicated admin middleware enforcing `role === 'admin'` on all administrative routes.
  - Non-admin or unauthenticated access blocked with strict HTTP 401/403 responses.
- **Catalog Management:**
  - Create, view, edit, and deactivate products with automated SKU/slug generation.
  - Manage product categories, hierarchy, and visibility.
- **Inventory Management:**
  - Real-time stock tracking across products and variants.
  - Low stock warning alerts and stock adjustments.
- **Order Fulfillment:**
  - Manage all customer orders, filter by status, and update tracking states with audit logs.
- **Review Moderation:**
  - Moderate customer ratings and toggle review active status.
- **User Management:**
  - View registered customers and staff with role inspection.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend UI** | [React 19](https://react.dev/) | Declarative component-based user interface |
| **Build Tool** | [Vite 8](https://vite.dev/) | Next-generation fast frontend bundler & dev server |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Modern utility-first responsive styling |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible SVG iconography |
| **Routing** | [React Router 7](https://reactrouter.com/) | Single Page Application client-side navigation |
| **Backend Runtime** | [Node.js](https://nodejs.org/) (v18+ / v24+) | Server-side JavaScript runtime environment |
| **Web Framework** | [Express 5](https://expressjs.com/) | RESTful API server routing and middleware |
| **Database** | [MySQL 8.0+](https://www.mysql.com/) | Relational database with foreign keys & InnoDB engine |
| **Database Client** | [mysql2](https://github.com/sidorares/node-mysql2) | High-performance Promise-based connection pooling |
| **Security / Auth** | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | Stateless JWT authentication tokens |
| **Password Hashing**| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Salted password hashing (10 rounds) |
| **Code Quality** | [Oxlint](https://oxc-project.github.io/) / ESLint | Fast Rust-based linter for clean code assurance |

---

## Project Architecture & Structure

```
shop-express/
├── .gitignore                    # Root production ignore rules
├── README.md                     # Comprehensive project documentation
├── backend/                      # Node.js + Express REST API
│   ├── .env.example              # Backend environment template
│   ├── .gitignore                # Backend specific exclusions
│   ├── package.json              # Backend dependencies and scripts
│   ├── server.js                 # API server entry point & route mounting
│   ├── config/
│   │   └── db.js                 # MySQL connection pool configuration
│   ├── controllers/
│   │   ├── addressController.js  # Customer address management logic
│   │   ├── adminController.js    # Administrative metrics, catalog & users
│   │   ├── authController.js     # User registration, login & JWT issuance
│   │   ├── cartController.js     # Persistent cart operations & stock check
│   │   ├── categoryController.js # Catalog categories
│   │   ├── orderController.js    # Transactional checkout & order history
│   │   ├── productController.js  # Catalog search, filtering, sorting, pagination
│   │   ├── reviewController.js   # Customer ratings, aggregates & moderation
│   │   └── wishlistController.js # Customer wishlist operations
│   ├── middleware/
│   │   ├── adminMiddleware.js    # Role authorization guard (admin only)
│   │   └── authMiddleware.js     # JWT verification & customer context
│   └── routes/
│       ├── addressRoutes.js      # /api/addresses
│       ├── adminRoutes.js        # /api/admin
│       ├── authRoutes.js         # /api/auth
│       ├── cartRoutes.js         # /api/cart
│       ├── categoryRoutes.js     # /api/categories
│       ├── orderRoutes.js        # /api/orders
│       ├── productRoutes.js      # /api/products
│       ├── reviewRoutes.js       # /api/products/:id/reviews & /api/reviews
│       └── wishlistRoutes.js     # /api/wishlist
├── database/                     # MySQL Relational Schema & Seeds
│   ├── README.md                 # Database setup and execution guide
│   ├── schema.sql                # Complete DDL creating all 21 tables & constraints
│   ├── seed.sql                  # Baseline categories, products, variants, and users
│   ├── phase10_reviews.sql       # Reviews table migration
│   └── phase11_products.sql      # 10 realistic e-commerce products with variants
└── frontend/                     # React + Vite Client Application
    ├── .env.example              # Frontend environment template
    ├── .gitignore                # Frontend specific exclusions
    ├── index.html                # HTML entry point
    ├── package.json              # Frontend dependencies and build scripts
    ├── vite.config.js            # Vite bundler configuration with Tailwind
    └── src/
        ├── App.jsx               # Application route definitions & layout
        ├── main.jsx              # React DOM entry point
        ├── admin/                # Admin portal views & layouts
        │   ├── layouts/AdminLayout.jsx
        │   └── pages/            # Dashboard, Products, Orders, Inventory, Reviews, Users
        ├── components/           # Reusable UI components
        │   ├── AdminRoute.jsx    # Protected route for administrators
        │   ├── CategoryFilter.jsx# Category pills / list filter
        │   ├── EmptyState.jsx    # Empty search/catalog view with actions
        │   ├── HeroSection.jsx   # Storefront promotional banner
        │   ├── Navbar.jsx        # Navigation bar with live cart/wishlist counters
        │   ├── Pagination.jsx    # Catalog page navigation controls
        │   ├── PriceFilter.jsx   # Custom min/max inputs & price presets
        │   ├── ProductCard.jsx   # Product showcase card with rating & actions
        │   ├── ProductGrid.jsx   # Responsive catalog grid with skeleton loaders
        │   └── ProtectedRoute.jsx# Authentication guard for customer routes
        ├── context/              # Global React state management
        │   ├── AuthContext.jsx   # User authentication & token state
        │   ├── CartContext.jsx   # Persistent cart synchronization
        │   └── WishlistContext.jsx# Live customer wishlist state
        ├── hooks/
        │   └── useProducts.js    # Product discovery custom hook
        ├── pages/                # Customer storefront views
        │   ├── CartPage.jsx
        │   ├── CheckoutPage.jsx
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── OrderDetailsPage.jsx
        │   ├── OrdersPage.jsx
        │   ├── ProductDetailsPage.jsx
        │   ├── ProductListingPage.jsx
        │   ├── RegisterPage.jsx
        │   └── WishlistPage.jsx
        └── services/             # API client services
            ├── adminApi.js
            ├── api.js
            └── reviewApi.js
```

---

## Prerequisites

Before getting started, ensure you have installed:
1. **Node.js**: Version `18.x` or higher (verified on Node.js `v24.x`).
2. **npm**: Version `9.x` or higher.
3. **MySQL Server**: Version `8.0` or higher running locally on port `3306` (or via Docker / cloud instance).

---

## Installation & Setup Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/Lahari-333/e-commerce.git
cd e-commerce
```

### Step 2: Database Setup
1. Log into your MySQL server:
   ```bash
   mysql -u root -p
   ```
2. Execute the schema script (creates the `shop_express` database and all 21 tables):
   ```sql
   SOURCE database/schema.sql;
   ```
3. Load the baseline seed data (roles, categories, core products, demo users):
   ```sql
   USE shop_express;
   SOURCE database/seed.sql;
   ```
4. (Optional) Load the extended 10 realistic sample products:
   ```sql
   SOURCE database/phase11_products.sql;
   ```

### Step 3: Configure Backend Environment
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the template and configure your credentials:
   ```bash
   cp .env.example .env
   ```
3. Open `backend/.env` and enter your MySQL credentials and JWT secret:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=shop_express
   DB_PORT=3306
   JWT_SECRET=super_secret_jwt_random_key_replace_in_production
   JWT_EXPIRES_IN=7d
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

### Step 4: Configure Frontend Environment
1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Copy the frontend environment template:
   ```bash
   cp .env.example .env
   ```
3. Open `frontend/.env` and confirm the API base URL:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

### Step 5: Start Development Servers

**1. Start Backend API Server:**
```bash
cd backend
npm run dev
```
*Backend server will start at `http://localhost:5000`.*
*Verify health at: `http://localhost:5000/api/health` and `http://localhost:5000/api/health/db`.*

**2. Start Frontend Client:**
```bash
cd frontend
npm run dev
```
*Frontend will launch at `http://localhost:5173`.*

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example Value |
|---|---|---|
| `PORT` | HTTP Port for Express server | `5000` |
| `HOST` | Network interface to bind (0.0.0.0 for cloud hosting) | `0.0.0.0` |
| `CLIENT_URL` | Deployed frontend domain for CORS authorization | `https://your-app.vercel.app` |
| `DB_HOST` | MySQL host address | `localhost` / `gateway01...` |
| `DB_USER` | MySQL database username | `root` / `admin` |
| `DB_PASSWORD` | MySQL database password | `your_secret_password` |
| `DB_NAME` | MySQL database name | `shop_express` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_SSL` | Enable SSL for cloud MySQL providers (true/false) | `false` / `true` |
| `DATABASE_URL` | Optional URI connection string (used by Railway/Render) | `mysql://user:pass@host:port/dbname` |
| `JWT_SECRET` | Secret signing key for JSON Web Tokens | `your_random_64_char_secret` |
| `JWT_EXPIRES_IN` | JWT validity duration | `7d` |

### Frontend (`frontend/.env`)
| Variable | Description | Example Value |
|---|---|---|
| `VITE_API_BASE_URL` | Target base URL for backend API requests | `https://your-api.onrender.com/api` |

> **⚠️ Security Reminder**: Never commit `.env` files to version control. Both `backend/.gitignore` and `frontend/.gitignore` enforce this. Always use `.env.example` for tracking variable schemas.

---

## Production Cloud Deployment Guide

Shop Express is pre-configured for seamless cloud deployment using **Vercel** (Frontend), **Render** (Backend API), and a **Cloud MySQL Provider** (e.g., TiDB Serverless, Aiven, or Railway).

### Step 1: Online MySQL Database Setup
1. Create a free MySQL database on [TiDB Cloud Serverless](https://tidbcloud.com/), [Aiven](https://aiven.io/), or [Railway](https://railway.com/).
2. Note your database connection credentials: Host, User, Password, Database Name, and Port (`3306`).
3. Connect using MySQL Workbench, DBeaver, or command line, and execute:
   - `database/schema.sql` (creates all 21 tables)
   - `database/seed.sql` (creates default roles, demo accounts, categories)
   - `database/phase11_products.sql` (loads catalog products)

### Step 2: Backend Deployment on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New + > Web Service**.
2. Connect your GitHub repository: `https://github.com/Lahari-333/e-commerce`.
3. Configure settings:
   - **Name:** `shop-express-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `PORT`: `5000`
   - `HOST`: `0.0.0.0`
   - `NODE_ENV`: `production`
   - `DB_HOST`: `your-cloud-mysql-host`
   - `DB_USER`: `your-cloud-mysql-user`
   - `DB_PASSWORD`: `your-cloud-mysql-password`
   - `DB_NAME`: `shop_express` (or your cloud db name)
   - `DB_PORT`: `3306` (or cloud port)
   - `DB_SSL`: `true`
   - `JWT_SECRET`: *(A long random secret string)*
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: *(Your Vercel frontend URL from Step 3)*
5. Click **Deploy Web Service**. Render will assign a public URL (e.g., `https://shop-express-api.onrender.com`).

### Step 3: Frontend Deployment on Vercel
1. Go to [vercel.com](https://vercel.com/) and click **Add New... > Project**.
2. Import your GitHub repository: `https://github.com/Lahari-333/e-commerce`.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend` (Click Edit and select `frontend`)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL`: `https://shop-express-api.onrender.com/api` *(replace with your Render backend URL)*
5. Click **Deploy**. Vercel will build and assign your live production URL (e.g., `https://shop-express.vercel.app`).
6. *(Final Step)* In your Render backend dashboard, set `CLIENT_URL` to your live Vercel domain to enforce CORS.

---

## REST API Reference

### 🔐 Authentication APIs (`/api/auth`)
- `POST /api/auth/register` — Register a new customer account.
- `POST /api/auth/login` — Authenticate user and receive JWT bearer token.
- `GET /api/auth/me` — Retrieve current user profile from bearer token.

### 📦 Product Discovery APIs (`/api/products`)
- `GET /api/products` — List products with search, category, sort, price, and pagination parameters:
  - `?page=1&limit=12` — Pagination metadata (`currentPage`, `totalPages`, `hasNextPage`).
  - `?sort=default|newest|price-asc|price-desc|name-asc|rating-desc` — Safe allowlist sorting.
  - `?minPrice=500&maxPrice=1500` — Effective selling price range filter.
  - `?category=electronics` — Category slug or numeric ID.
  - `?search=speaker` — Keyword search across name and descriptions.
  - `?featured=true` — Filter featured items.
- `GET /api/products/featured` — Retrieve top featured products for homepage.
- `GET /api/products/:slug` — Get full product details including variants, images, and inventory.

### 🗂️ Category APIs (`/api/categories`)
- `GET /api/categories` — List all active categories.

### 🛒 Shopping Cart APIs (`/api/cart`)
- `GET /api/cart` — Get authenticated customer's cart items, subtotal, and stock.
- `POST /api/cart/items` — Add item (with optional `variant_id`) to cart.
- `PUT /api/cart/items/:itemId` — Update item quantity with stock validation.
- `DELETE /api/cart/items/:itemId` — Remove single item from cart.
- `DELETE /api/cart` — Clear entire cart.

### 📍 Address APIs (`/api/addresses`)
- `GET /api/addresses` — List saved addresses for authenticated user.
- `POST /api/addresses` — Add a new address.
- `PUT /api/addresses/:id` — Update an existing address.
- `DELETE /api/addresses/:id` — Delete an address.
- `PATCH /api/addresses/:id/default` — Set as default shipping address.

### 💳 Order & Checkout APIs (`/api/orders`)
- `POST /api/orders` — Create order from current cart with transaction locking & inventory deduction.
- `GET /api/orders` — List authenticated user's order history.
- `GET /api/orders/:orderNumber` — Retrieve complete details of a specific order.

### ❤️ Wishlist APIs (`/api/wishlist`)
- `GET /api/wishlist` — List items saved in user's wishlist.
- `POST /api/wishlist` — Add a product to wishlist.
- `DELETE /api/wishlist/:productId` — Remove product from wishlist.
- `GET /api/wishlist/check/:productId` — Check if product is in user's wishlist.

### ⭐ Product Review APIs (`/api`)
- `GET /api/products/:productId/reviews` — List active reviews & aggregate ratings for product.
- `POST /api/products/:productId/reviews` — Submit review with 1–5 star rating.
- `PUT /api/reviews/:reviewId` — Update existing review.
- `DELETE /api/reviews/:reviewId` — Delete review.

### 👑 Admin Management APIs (`/api/admin`)
- `GET /api/admin/dashboard` — Overview metrics (total revenue, order counts, users, stock alerts).
- `GET /api/admin/products` — List all products with admin controls.
- `POST /api/admin/products` — Create new product with variants and inventory.
- `PUT /api/admin/products/:id` — Update product information.
- `DELETE /api/admin/products/:id` — Deactivate product.
- `GET /api/admin/inventory` — View and update inventory levels.
- `GET /api/admin/orders` — View all system orders.
- `PATCH /api/admin/orders/:id/status` — Update fulfillment status (e.g., shipped, delivered).
- `GET /api/admin/users` — List registered users and role details.
- `GET /api/admin/reviews` — Moderate customer reviews (approve / hide).

---

## Demo Accounts

For local development and testing, default accounts are seeded via `database/seed.sql`:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Customer** | `demo.customer@shopexpress.test` | `password123` | Catalog, Cart, Checkout, Wishlist, Reviews, Orders |
| **Administrator** | `demo.admin@shopexpress.test` | `password123` | Storefront + Full Admin Portal (`/admin`) |

> **Note**: Passwords in `seed.sql` are stored as cryptographically secure `bcrypt` hashes. Always update default credentials before deploying to any publicly accessible environment.

---

## Available Scripts

### Backend (`cd backend`)
- `npm start` — Starts the production Node.js server (`node server.js`).
- `npm run dev` — Starts development server with auto-reload via `nodemon`.

### Frontend (`cd frontend`)
- `npm run dev` — Launches Vite local development server with HMR.
- `npm run build` — Builds optimized production bundle in `frontend/dist/`.
- `npm run preview` — Locally previews production build.
- `npm run lint` — Runs fast Oxlint code quality verification.

---

## Testing & Verification

Shop Express includes an automated test suite verifying all critical backend API and e-commerce flows:

1. **Backend Discovery Tests (19/19 passing):**
   - Default pagination with limit controls.
   - Page navigation and non-overlapping results between pages.
   - Keyword search combined with pagination.
   - Category filtering with pagination.
   - Min/max price range filtering using effective selling price.
   - Sort orders: `price-asc`, `price-desc`, `name-asc`, and `rating-desc`.
   - Combined multi-filter queries.
   - Graceful fallback for invalid page/limit inputs.
   - HTTP 400 validation for invalid price ranges (`minPrice > maxPrice`, negative values).
   - SQL injection immunity on search and sort parameters.
   - Accurate total count and `hasNextPage` calculations.

2. **Full Regression Verification (19/19 passing):**
   - Public categories and featured products.
   - Product details by slug.
   - Review aggregates calculation.
   - Role-based admin route protection.
   - Multi-page product uniqueness across catalog traversal (zero duplicates).

3. **Frontend Build Verification:**
   - `npm run build` compiles in under 1 second with 0 syntax or bundling errors.
   - `npm run lint` passes with 0 errors.

---

## Security Best Practices

1. **Environment Secrets Protection**: `.env` files are explicitly ignored in `.gitignore` across the project.
2. **Safe Parameterized SQL**: All database operations use `mysql2` prepared statements (`?` placeholders) preventing SQL injection.
3. **Allowlist Sorting**: Order by parameters are strictly validated against an allowlist; unknown parameters safely default to relevance order.
4. **Password Security**: Customer and admin passwords are never stored in plaintext and use salted `bcrypt` hashing.
5. **Role Authorization**: All administrative endpoints enforce dual-layer verification (valid JWT + verified `role === 'admin'` check against database).
6. **Concurrency Protection**: Checkout utilizes MySQL transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) with row locking (`FOR UPDATE`) to prevent inventory race conditions.

---

## Production Deployment Guide

Shop Express is architected for zero-cost cloud deployment using industry-standard modern platforms:

| Component | Platform | Configuration |
|---|---|---|
| **Database** | [TiDB Cloud Serverless](https://tidbcloud.com/) | Managed MySQL-compatible serverless database with TLS encryption |
| **Backend REST API** | [Render](https://render.com/) | Node.js Express Web Service bound to `0.0.0.0:${PORT}` |
| **Frontend Storefront** | [Vercel](https://vercel.com/) | Vite React SPA with client-side SPA rewrites |

---

### Step 1: Cloud MySQL Database Setup (TiDB Cloud)
1. Sign up / log in to [TiDB Cloud](https://tidbcloud.com/) using GitHub authentication.
2. Click **Create Cluster** and select **TiDB Serverless** (100% free forever, no credit card required).
3. Name your cluster (e.g., `shop-express`) and choose a region close to your target audience (e.g., Singapore `ap-southeast-1`).
4. Click **SQL Editor** in the TiDB Cloud console and connect to your cluster.
5. Create the database schema:
   - Open [`database/tidb_cloud_migration.sql`](file:///C:/Users/lahar/shop-express/database/tidb_cloud_migration.sql)
   - Paste the SQL script and click **Run** to provision all 19 tables, indexes, and foreign keys.
6. Populate initial seed data:
   - Open [`database/tidb_seed_data.sql`](file:///C:/Users/lahar/shop-express/database/tidb_seed_data.sql)
   - Paste the SQL script and click **Run** to load categories, products, variants, images, inventory, demo users, addresses, coupons, and reviews.
7. Click **Connect** in the TiDB Cloud dashboard and select **Node.js / General** to view your connection credentials (`DB_HOST`, `DB_PORT=4000`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=shop_express`).

---

### Step 2: Backend REST API Deployment (Render)
1. Log in to [Render](https://render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository: `https://github.com/Lahari-333/e-commerce`.
3. Configure the service settings:
   - **Name**: `shop-express-api` (or preferred name)
   - **Region**: Singapore (Southeast Asia) or region closest to TiDB Cloud cluster
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Under **Environment Variables**, add the following:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default assigned by Render)
   - `HOST`: `0.0.0.0`
   - `FRONTEND_URL`: `https://shop-express-jet.vercel.app`
   - `CLIENT_URL`: `https://shop-express-jet.vercel.app`
   - `DB_HOST`: *<Your TiDB Cloud Host, e.g. gateway01.ap-southeast-1.prod.aws.tidbcloud.com>*
   - `DB_PORT`: `4000`
   - `DB_USER`: *<Your TiDB Cloud Username>*
   - `DB_PASSWORD`: *<Your TiDB Cloud Password>*
   - `DB_NAME`: `shop_express`
   - `DB_SSL`: `true`
   - `DB_SSL_REJECT_UNAUTHORIZED`: `true`
   - `JWT_SECRET`: *<A secure random 32+ character string>*
   - `JWT_EXPIRES_IN`: `7d`
5. Click **Create Web Service**. Wait for Render to build and deploy.
6. Verify your backend deployment:
   - Basic Health Check: `GET https://<your-render-app>.onrender.com/api/health` -> `{"status":"ok"}`
   - Database Health Check: `GET https://<your-render-app>.onrender.com/api/health/db` -> `{"database":"connected"}`

---

### Step 3: Frontend Storefront Deployment (Vercel)
1. The frontend is deployed to Vercel (e.g. `https://shop-express-jet.vercel.app`).
2. In the [Vercel Dashboard](https://vercel.com/), navigate to your project -> **Settings** -> **Environment Variables**.
3. Add / Update:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://<your-render-app>.onrender.com/api` (or `https://<your-render-app>.onrender.com` — normalized automatically)
   - **Target**: Production, Preview, Development
4. Navigate to the **Deployments** tab and click **Redeploy** on the latest deployment to build with the updated backend URL.
5. Test the live site:
   - Browse catalog products, categories, search, price filters, and pagination.
   - Test variant selection and cart functionality.
   - Log in with demo customer or admin credentials.
   - Place an order and review order tracking in the customer profile.
   - Access the admin panel at `/admin` to verify dashboard statistics.

---

## Future Enhancements
The following features are planned for future major releases:
- **Payment Gateway Integration**: Direct integration with Razorpay / Stripe for automated card and UPI webhooks.
- **Transactional Notifications**: Automated email notifications for order confirmation and shipment tracking.
- **Advanced Analytics**: Visual sales metrics charts and inventory demand forecasting in the admin dashboard.
- **Containerized Deployment**: Dockerfile and Docker Compose definitions for one-click multi-container deployment.

---

## License
This project is licensed under the MIT License.
