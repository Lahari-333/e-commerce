# Shop Express - MySQL Database Guide

This directory contains the database design and migration scripts for the Shop Express full-stack e-commerce application.

## Directory Contents

* `schema.sql`: Complete DDL schema creating all 21 tables, primary keys, foreign keys, constraints, and indexes using InnoDB and `utf8mb4`.
* `seed.sql`: Baseline demo and development seed data (sample roles, demo user accounts, catalog categories, core products, variants, images, stock levels, and test coupons).
* `phase11_products.sql`: Extended realistic catalog products seed script (10 additional e-commerce items across electronics, fitness, home, fashion, and kitchen).
* `README.md`: Setup, execution, verification, and maintenance instructions.

---

## 1. Prerequisites

* **MySQL Server 8.0 or higher** installed and running locally or on a remote host.
* **MySQL Command-Line Client (`mysql`)** or a GUI client such as **MySQL Workbench**, **DBeaver**, or **DataGrip**.
* Appropriate user privileges (`CREATE DATABASE`, `CREATE TABLE`, `INSERT`, `ALTER`, `DROP`).

---

## 2. Connecting to MySQL

Open your terminal or PowerShell and connect to your MySQL instance:

```bash
# Connect with default root user
mysql -u root -p
```
Enter your MySQL password when prompted.

---

## 3. How to Execute `schema.sql`

### Option A: From MySQL Command-Line Client
```sql
-- Inside the MySQL prompt:
SOURCE C:/Users/lahar/shop-express/database/schema.sql;
```
*(Note: Use forward slashes `/` for file paths in MySQL commands on Windows).*

### Option B: From PowerShell / Bash
```bash
# Navigate to the project root or database directory
cd C:\Users\lahar\shop-express\database

# Run schema script directly
mysql -u root -p < schema.sql
```

---

## 4. How to Execute `seed.sql`

Once `schema.sql` has created the `shop_express` database and tables:

### Option A: From MySQL Command-Line Client
```sql
-- Inside the MySQL prompt:
USE shop_express;
SOURCE C:/Users/lahar/shop-express/database/seed.sql;
```

### Option B: From PowerShell / Bash
```bash
# Run seed script directly
mysql -u root -p shop_express < seed.sql
```

---

## 5. How to Verify Tables and Records

Run the following SQL queries inside MySQL to verify successful setup:

```sql
USE shop_express;

-- List all tables (should return 18 tables)
SHOW TABLES;

-- Verify sample categories
SELECT id, name, slug FROM categories;

-- Verify sample products with base prices
SELECT id, name, sku, base_price, discount_price FROM products;

-- Verify inventory stock quantities
SELECT p.name AS product, pv.variant_name, i.quantity 
FROM inventory i
JOIN products p ON i.product_id = p.id
LEFT JOIN product_variants pv ON i.variant_id = pv.id;

-- Verify test coupons
SELECT code, discount_type, discount_value, min_order_amount FROM coupons;

-- Verify demo accounts
SELECT id, first_name, last_name, email, role_id FROM users;
```

---

## 6. How to Reset the Development Database Safely

If you need a clean slate during local development:

```sql
-- Step 1: Drop the development database
DROP DATABASE IF EXISTS shop_express;

-- Step 2: Re-run schema and seed scripts
SOURCE C:/Users/lahar/shop-express/database/schema.sql;
SOURCE C:/Users/lahar/shop-express/database/seed.sql;
```

> ⚠️ **PRODUCTION WARNING**
>
> Never execute `DROP DATABASE` or rerun `schema.sql` directly on staging or production environments. Doing so will permanently destroy all customer accounts, order histories, payment logs, and live inventory records. Always use versioned migration workflows for production databases.

---

## 7. Demo Accounts & Credentials

The seed data provides two development accounts:

| Role | Email | Password |
|---|---|---|
| **Customer** | `demo.customer@shopexpress.test` | `password123` |
| **Admin** | `demo.admin@shopexpress.test` | `password123` |

*(All passwords in `seed.sql` are securely stored as bcrypt hashes with salt rounds of 10).*
