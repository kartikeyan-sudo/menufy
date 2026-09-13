const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:1234%40Qwer%40Asdf%40Zxcv%40@db.rgsomwpnnhqkyybdivnx.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function init() {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS public.restaurants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        logo_url TEXT,
        description TEXT,
        address TEXT,
        phone TEXT,
        telegram_chat_id TEXT,
        telegram_connected BOOLEAN DEFAULT FALSE,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
        table_number TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
        telegram_sent BOOLEAN DEFAULT FALSE,
        telegram_error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        item_name TEXT NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        price_at_order NUMERIC(10, 2) NOT NULL CHECK (price_at_order >= 0)
      );

      CREATE TABLE IF NOT EXISTS public.telegram_connection_tokens (
        token TEXT PRIMARY KEY,
        restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.telegram_updates (
        update_id BIGINT PRIMARY KEY,
        processed_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO public.restaurants (id, name, slug, description, telegram_chat_id, telegram_connected)
      VALUES ('11111111-1111-1111-1111-111111111111', 'Sharma Cafe', 'sharma-cafe', 'Fresh Wood-fired Pizzas, Gourmet Burgers & Artisanal Coffee', '5359923752', true)
      ON CONFLICT (id) DO UPDATE SET name = 'Sharma Cafe', telegram_chat_id = '5359923752', telegram_connected = true;
    `);
    console.log('🎉 PostgreSQL Database Schema & Default Restaurant Initialized Successfully!');
  } catch (err) {
    console.error('DB INIT ERR:', err.message);
  } finally {
    pool.end();
  }
}

init();
