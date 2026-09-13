-- ==================================================
-- MENUFY DATABASE SCHEMA & SECURITY POLICIES
-- Multi-tenant architecture for AI QR Menu + Ordering
-- ==================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------
-- TABLE: restaurants
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    description TEXT,
    address TEXT,
    phone TEXT,
    telegram_chat_id TEXT,
    telegram_connected BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookup
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);

-- --------------------------------------------------
-- TABLE: menu_categories
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.menu_categories(restaurant_id);

-- --------------------------------------------------
-- TABLE: menu_items
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.menu_items(category_id);

-- --------------------------------------------------
-- TABLE: orders
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'preparing', 'ready', 'completed', 'cancelled')),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    telegram_sent BOOLEAN DEFAULT FALSE,
    telegram_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- --------------------------------------------------
-- TABLE: order_items
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_order NUMERIC(10, 2) NOT NULL CHECK (price_at_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ==================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 1. Restaurants Policies
CREATE POLICY "Owners can manage their own restaurants"
    ON public.restaurants
    FOR ALL
    USING (auth.uid() = owner_id);

CREATE POLICY "Public can view published restaurants by slug"
    ON public.restaurants
    FOR SELECT
    USING (is_published = TRUE);

-- 2. Menu Categories Policies
CREATE POLICY "Owners can manage categories"
    ON public.menu_categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = menu_categories.restaurant_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Public can view active categories of published restaurants"
    ON public.menu_categories
    FOR SELECT
    USING (
        is_active = TRUE AND EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = menu_categories.restaurant_id
            AND is_published = TRUE
        )
    );

-- 3. Menu Items Policies
CREATE POLICY "Owners can manage menu items"
    ON public.menu_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = menu_items.restaurant_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Public can view available items of published restaurants"
    ON public.menu_items
    FOR SELECT
    USING (
        is_available = TRUE AND EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = menu_items.restaurant_id
            AND is_published = TRUE
        )
    );

-- 4. Orders Policies
CREATE POLICY "Owners can view and manage their restaurant orders"
    ON public.orders
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = orders.restaurant_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Public can create orders for published restaurants"
    ON public.orders
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = orders.restaurant_id
            AND is_published = TRUE
        )
    );

-- 5. Order Items Policies
CREATE POLICY "Owners can view order items"
    ON public.order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            JOIN public.restaurants ON restaurants.id = orders.restaurant_id
            WHERE orders.id = order_items.order_id
            AND restaurants.owner_id = auth.uid()
        )
    );

CREATE POLICY "Public can insert order items"
    ON public.order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            JOIN public.restaurants ON restaurants.id = orders.restaurant_id
            WHERE orders.id = order_items.order_id
            AND restaurants.is_published = TRUE
        )
    );

-- --------------------------------------------------
-- TABLE: telegram_connection_tokens
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_connection_tokens (
    token TEXT PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_tokens_restaurant ON public.telegram_connection_tokens(restaurant_id);

ALTER TABLE public.telegram_connection_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their connection tokens"
    ON public.telegram_connection_tokens
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = telegram_connection_tokens.restaurant_id
            AND owner_id = auth.uid()
        )
    );

-- --------------------------------------------------
-- TABLE: telegram_updates (Idempotency Tracking)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_updates (
    update_id BIGINT PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);


