// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type {
  Product,
  Review,
  CartItem,
  Order,
  OrderItem,
  Profile,
  ShippingAddress,
  getSalePrice,
} from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const authApi = {
  /** Sign up with email + password */
  async signUp(email: string, password: string, fullName: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
  },

  /** Sign in */
  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  /** Sign out */
  async signOut() {
    return supabase.auth.signOut();
  },

  /** Get current session */
  async getSession() {
    return supabase.auth.getSession();
  },

  /** Get current user */
  async getUser() {
    return supabase.auth.getUser();
  },

  /** Get profile for a user */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) return null;
    return data as Profile;
  },
};

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

export const productsApi = {
  /** Fetch all products */
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Product[]) ?? [];
  },

  /** Fetch a single product by id */
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as Product;
  },

  /** Fetch products on sale */
  async getOnSale(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("sale_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Product[]) ?? [];
  },

  /** Admin: create product */
  async create(
    product: Omit<Product, "id" | "created_at" | "updated_at">,
  ): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    return data as Product;
  },

  /** Admin: update product */
  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Product;
  },

  /** Admin: delete product */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  /** Admin: toggle sale */
  async toggleSale(
    id: string,
    active: boolean,
    percentage?: number,
  ): Promise<Product> {
    return productsApi.update(id, {
      sale_active: active,
      sale_percentage: percentage ?? null,
    });
  },
};

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────

export const reviewsApi = {
  /** Get reviews for a product */
  async getByProduct(productId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Review[]) ?? [];
  },

  /** Add a review */
  async add(review: {
    product_id: string;
    reviewer_name: string;
    rating: number;
    comment?: string;
  }): Promise<Review> {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("reviews")
      .insert({ ...review, user_id: userData?.user?.id ?? null })
      .select()
      .single();
    if (error) throw error;
    return data as Review;
  },

  /** Delete own review */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────

export const cartApi = {
  /** Get all cart items with product details */
  async getCart(userId: string): Promise<CartItem[]> {
    const { data, error } = await supabase
      .from("cart_items")
      .select("*, product:products(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as CartItem[]) ?? [];
  },

  /** Add item to cart (upsert) */
  async addItem(
    userId: string,
    productId: string,
    size: string | null,
    quantity = 1,
  ): Promise<CartItem> {
    // Try to find existing
    const { data: existing } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("size", size ?? "")
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .select("*, product:products(*)")
        .single();
      if (error) throw error;
      return data as CartItem;
    }

    const { data, error } = await supabase
      .from("cart_items")
      .insert({ user_id: userId, product_id: productId, size, quantity })
      .select("*, product:products(*)")
      .single();
    if (error) throw error;
    return data as CartItem;
  },

  /** Update quantity */
  async updateQuantity(itemId: string, quantity: number): Promise<CartItem> {
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", itemId)
      .select("*, product:products(*)")
      .single();
    if (error) throw error;
    return data as CartItem;
  },

  /** Remove item */
  async removeItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);
    if (error) throw error;
  },

  /** Clear cart */
  async clearCart(userId: string): Promise<void> {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
  },
};

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export const ordersApi = {
  /** Create order from cart */
  async createFromCart(
    userId: string,
    cartItems: CartItem[],
    shippingAddress: ShippingAddress,
  ): Promise<Order> {
    // Calculate total
    const total = cartItems.reduce((sum, item) => {
      const p = item.product!;
      const unitPrice = p.price;
      const salePrice =
        p.sale_active && p.sale_percentage
          ? p.price * (1 - p.sale_percentage / 100)
          : null;
      return sum + (salePrice ?? unitPrice) * item.quantity;
    }, 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: total,
        shipping_address: shippingAddress,
      })
      .select()
      .single();
    if (orderError) throw orderError;

    // Create order items
    const orderItems: Omit<OrderItem, "id">[] = cartItems.map((item) => {
      const p = item.product!;
      const salePrice =
        p.sale_active && p.sale_percentage
          ? p.price * (1 - p.sale_percentage / 100)
          : null;
      return {
        order_id: order.id,
        product_id: p.id,
        product_name: p.name,
        product_image: p.image_url,
        size: item.size,
        quantity: item.quantity,
        unit_price: p.price,
        sale_price: salePrice,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);
    if (itemsError) throw itemsError;

    // Clear cart
    await cartApi.clearCart(userId);

    return order as Order;
  },

  /** Get user orders */
  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Order[]) ?? [];
  },
};
