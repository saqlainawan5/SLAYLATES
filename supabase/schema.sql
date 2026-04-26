-- ============================================================
-- SLAYLATES DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  sale_percentage numeric(5,2) check (sale_percentage >= 0 and sale_percentage <= 100),
  sale_active boolean default false,
  image_url text,
  images text[] default '{}',
  sizes text[] default '{}',   -- e.g. ["6 inches","6.5 inches","7 inches"]
  category text,
  stock integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

-- Anyone can read products
create policy "Products are publicly visible"
  on public.products for select
  using (true);

-- Only admins can insert/update/delete products
create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Computed sale price helper (used in app logic)
-- sale_price = price - (price * sale_percentage / 100)

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  reviewer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are publicly visible"
  on public.reviews for select
  using (true);

create policy "Authenticated users can add reviews"
  on public.reviews for insert
  with check (auth.uid() is not null);

create policy "Users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ============================================================
-- CART ITEMS
-- ============================================================
create table public.cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer default 1 check (quantity > 0),
  size text,
  created_at timestamptz default now(),
  unique(user_id, product_id, size)
);

alter table public.cart_items enable row level security;

create policy "Users can manage their own cart"
  on public.cart_items for all
  using (auth.uid() = user_id);

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  total_amount numeric(10,2) not null,
  status text default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  shipping_address jsonb,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text,
  size text,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  sale_price numeric(10,2)
);

alter table public.order_items enable row level security;

create policy "Users can view their own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid()
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_products_sale on public.products(sale_active);
create index idx_reviews_product on public.reviews(product_id);
create index idx_cart_user on public.cart_items(user_id);
create index idx_orders_user on public.orders(user_id);

-- ============================================================
-- SEED: Make first user admin (run after creating your account)
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your@email.com';
-- ============================================================
