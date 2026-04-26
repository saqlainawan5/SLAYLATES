# Slaylates 💎 — Handmade Bracelet Store

A full-stack e-commerce website for handmade bracelets built with **React + TypeScript** (frontend) and **Supabase** (backend/database).

---

## 📁 Project Structure

```
slaylates/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example                   ← Copy to .env.local
│
├── supabase/
│   └── schema.sql                 ← Run this in Supabase SQL editor
│
└── src/
    ├── main.tsx                   ← App entry point
    ├── App.tsx                    ← Routes + Providers
    ├── index.css                  ← Global styles
    │
    ├── types/
    │   └── index.ts               ← TypeScript interfaces + helpers
    │
    ├── lib/
    │   └── supabase.ts            ← Supabase client + all API functions
    │
    ├── context/
    │   ├── AuthContext.tsx        ← Auth state (user, profile, isAdmin)
    │   └── CartContext.tsx        ← Cart state (items, add/remove/qty)
    │
    ├── components/
    │   ├── Navbar.tsx / .css      ← Top navigation bar
    │   └── ProductCard.tsx / .css ← Reusable product grid card
    │
    └── pages/
        ├── HomePage.tsx / .css    ← Landing page with hero + collections
        ├── ProductsPage.tsx / .css← Browse & filter all products
        ├── ProductDetailPage.tsx  ← Single product: sizes, reviews, cart
        ├── CartPage.tsx / .css    ← Cart items + order summary + checkout
        ├── LoginPage.tsx / .css   ← Sign in & sign up
        └── AdminPage.tsx / .css   ← Admin: add/edit/delete products
```

---

## ⚡ Quick Setup

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New Project → note your **Project URL** and **anon key**.

### 2. Run the database schema
In your Supabase dashboard → **SQL Editor** → paste and run the contents of `supabase/schema.sql`.

### 3. Configure environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Make yourself an admin
After creating your account via the login page, run this in Supabase SQL Editor:
```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'your@email.com';
```

### 5. Install & run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Extends Supabase auth.users; stores is_admin flag |
| `products` | Bracelets with price, sale %, images, sizes |
| `reviews` | Customer reviews (rating 1-5, comment, name) |
| `cart_items` | Per-user cart (product + size + quantity) |
| `orders` | Completed orders with total and status |
| `order_items` | Line items per order with captured prices |

---

## 🔑 Key Features

### Products
- Add products with: name, description, price, category, images, sizes (in inches), stock
- Toggle sale on/off with a percentage — the displayed price auto-calculates to post-sale price
- Original price shown with strikethrough when sale is active

### Product Detail Page
- Image gallery with thumbnail navigation
- Size selector (in inches)
- Quantity control
- Avg star rating from all reviews
- Full reviews list with date + star rating
- Add a review form (name, rating, comment) — no login required to review

### Cart
- Add items with chosen size and quantity
- Change quantity or remove items
- Savings shown when sale items are in cart
- Checkout places order and clears cart

### Auth
- Sign in / Sign up on the same page with tab toggle
- Supabase handles email/password auth
- Profile auto-created on signup via database trigger

### Admin (protected route)
- View stats: total products, on sale, in stock
- Full product table with edit/delete
- Modal form to create or edit products
- Sale toggle with live price preview
- Comma-separated sizes and image URLs

---

## 🚀 Deployment

### Vercel (recommended)
```bash
npm i -g vercel
vercel
```
Add your environment variables in the Vercel dashboard.

### Netlify
```bash
npm run build
# drag dist/ folder to netlify.com
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, React Router v6, Vite
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Styling**: Pure CSS with CSS custom properties (no Tailwind needed)
- **Fonts**: Cormorant Garamond (headings) + Jost (body)
