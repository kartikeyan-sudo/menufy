export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  telegram_chat_id?: string | null;
  telegram_connected: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_number: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: OrderStatus;
  total_amount: number;
  telegram_sent: boolean;
  telegram_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string | null;
  item_name: string;
  quantity: number;
  price_at_order: number;
}

// AI Menu Extraction Types
export interface ExtractedMenuItem {
  name: string;
  description?: string;
  price: number | null;
  confidence?: 'high' | 'medium' | 'low';
}

export interface ExtractedCategory {
  name: string;
  items: ExtractedMenuItem[];
}

export interface AIMenuExtractionResult {
  categories: ExtractedCategory[];
  rawText?: string;
}
