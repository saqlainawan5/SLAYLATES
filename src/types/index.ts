// src/types/index.ts

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sale_percentage: number | null;
  sale_active: boolean;
  image_url: string | null;
  images: string[];
  sizes: string[];
  category: string | null;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: ShippingAddress | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  sale_price: number | null;
}

export interface ShippingAddress {
  full_name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Utility: compute effective price after sale
export function getSalePrice(product: Product): number {
  if (product.sale_active && product.sale_percentage) {
    return product.price * (1 - product.sale_percentage / 100);
  }
  return product.price;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
