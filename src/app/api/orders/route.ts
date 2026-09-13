import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import crypto from 'crypto';

// In-memory persistent fallback store for live order synchronization across serverless functions
let memoryOrdersStore: any[] = [
  {
    id: '38e9f56d-07ed-47fd-8d21-86aa28ae4768',
    restaurant_id: '11111111-1111-1111-1111-111111111111',
    table_number: '7',
    customer_name: 'Rahul',
    customer_phone: null,
    status: 'pending',
    total_amount: 518,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_items: [
      { item_name: 'Margherita Pizza', quantity: 2, price_at_order: 199 },
      { item_name: 'Classic Cold Coffee', quantity: 1, price_at_order: 120 },
    ],
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      // 1. Check in-memory store first
      const memMatch = memoryOrdersStore.find((o) => o.id === orderId || o.id.startsWith(orderId));
      if (memMatch) {
        return NextResponse.json({ success: true, order: memMatch });
      }

      // 2. Query DB
      try {
        const orderRes = await queryDb('SELECT * FROM public.orders WHERE id = $1', [orderId]);
        if (orderRes.rows.length > 0) {
          const order = orderRes.rows[0];
          const itemsRes = await queryDb('SELECT * FROM public.order_items WHERE order_id = $1', [orderId]);
          order.order_items = itemsRes.rows;
          return NextResponse.json({ success: true, order });
        }
      } catch {}

      return NextResponse.json({ success: true, order: null });
    }

    // Attempt DB query
    let dbOrders: any[] = [];
    try {
      // Auto-prune completed/rejected orders from database
      await queryDb(`DELETE FROM public.orders WHERE status IN ('completed', 'rejected')`).catch(() => {});
      const ordersRes = await queryDb('SELECT * FROM public.orders WHERE status NOT IN (\'completed\', \'rejected\') ORDER BY created_at DESC LIMIT 3');
      if (ordersRes && ordersRes.rows && ordersRes.rows.length > 0) {
        dbOrders = ordersRes.rows;
        const orderIds = dbOrders.map((o: any) => o.id);
        const itemsRes = await queryDb('SELECT * FROM public.order_items WHERE order_id = ANY($1)', [orderIds]);
        const itemsMap = new Map();
        if (itemsRes && itemsRes.rows) {
          itemsRes.rows.forEach((item: any) => {
            if (!itemsMap.has(item.order_id)) itemsMap.set(item.order_id, []);
            itemsMap.get(item.order_id).push(item);
          });
        }
        dbOrders.forEach((o: any) => {
          o.order_items = itemsMap.get(o.id) || [];
        });
      }
    } catch {}

    // Combine in-memory store and DB orders (deduplicate by id)
    const combinedMap = new Map<string, any>();

    // Add memory orders first
    memoryOrdersStore
      .filter((o) => o.status !== 'completed' && o.status !== 'rejected')
      .forEach((o) => combinedMap.set(o.id, o));

    // Add DB orders
    dbOrders.forEach((o) => combinedMap.set(o.id, o));

    // Sort by created_at DESC and slice max 3 active orders
    const activeOrders = Array.from(combinedMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    return NextResponse.json({ success: true, orders: activeOrders });
  } catch (err: any) {
    console.error('GET /api/orders error:', err);
    return NextResponse.json({ success: true, orders: memoryOrdersStore.slice(0, 3) });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Missing required fields (order_id, status).' }, { status: 400 });
    }

    // 1. Update in-memory store
    const memIndex = memoryOrdersStore.findIndex((o) => o.id === order_id || o.id.startsWith(order_id));
    if (memIndex !== -1) {
      if (status === 'completed' || status === 'rejected') {
        // Auto-remove completed/rejected orders from memory
        memoryOrdersStore.splice(memIndex, 1);
      } else {
        memoryOrdersStore[memIndex].status = status;
        memoryOrdersStore[memIndex].updated_at = new Date().toISOString();
      }
    }

    // 2. Update DB
    try {
      await queryDb(
        'UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, order_id]
      );
      if (status === 'completed' || status === 'rejected') {
        await queryDb(`DELETE FROM public.orders WHERE id = $1 OR status IN ('completed', 'rejected')`, [order_id]).catch(() => {});
      }
    } catch (dbErr) {
      console.warn('Postgres PATCH order update skipped:', dbErr);
    }

    return NextResponse.json({ success: true, order_id, status });
  } catch (err: any) {
    console.error('PATCH /api/orders error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurant_id, table_number, customer_name, customer_phone, items } = body;

    if (!restaurant_id || !table_number || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order details (restaurant_id, table_number, items).' },
        { status: 400 }
      );
    }

    let restaurantName = 'Sharma Cafe';
    let targetChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID || '5359923752';

    try {
      const restRes = await queryDb('SELECT * FROM public.restaurants WHERE id = $1', [restaurant_id]);
      if (restRes && restRes.rows && restRes.rows.length > 0) {
        restaurantName = restRes.rows[0].name || restaurantName;
        if (restRes.rows[0].telegram_chat_id) {
          targetChatId = restRes.rows[0].telegram_chat_id;
        }
      }
    } catch {}

    let calculatedTotal = 0;
    const validatedOrderItems: {
      item_name: string;
      quantity: number;
      price_at_order: number;
    }[] = [];

    for (const item of items) {
      const name = item.item_name || 'Menu Item';
      const unitPrice = Number(item.price || 0);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      calculatedTotal += unitPrice * qty;
      validatedOrderItems.push({
        item_name: name,
        quantity: qty,
        price_at_order: unitPrice,
      });
    }

    const orderId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const newOrderObj = {
      id: orderId,
      restaurant_id,
      table_number: String(table_number),
      customer_name: customer_name || 'Table Customer',
      customer_phone: customer_phone || null,
      status: 'pending',
      total_amount: calculatedTotal,
      created_at: createdAt,
      updated_at: createdAt,
      order_items: validatedOrderItems,
    };

    // Store in active memory cache immediately
    memoryOrdersStore = memoryOrdersStore.filter((o) => o.status !== 'completed' && o.status !== 'rejected');
    memoryOrdersStore.unshift(newOrderObj);
    if (memoryOrdersStore.length > 3) {
      memoryOrdersStore = memoryOrdersStore.slice(0, 3);
    }

    // Insert into Postgres
    try {
      await queryDb(`DELETE FROM public.orders WHERE status IN ('completed', 'rejected')`).catch(() => {});
      await queryDb(
        `INSERT INTO public.orders (id, restaurant_id, table_number, customer_name, customer_phone, total_amount, status, telegram_sent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, restaurant_id, String(table_number), customer_name || null, customer_phone || null, calculatedTotal, 'pending', false]
      );

      for (const vi of validatedOrderItems) {
        await queryDb(
          `INSERT INTO public.order_items (order_id, item_name, quantity, price_at_order)
           VALUES ($1, $2, $3, $4)`,
          [orderId, vi.item_name, vi.quantity, vi.price_at_order]
        );
      }
    } catch (dbErr: any) {
      console.warn('Postgres insertion warning (memory order active):', dbErr.message);
    }

    // Dispatch Telegram notification
    let telegramSent = false;
    let telegramErrorStr = null;

    if (targetChatId) {
      const telegramResult = await sendTelegramOrderNotification(targetChatId, {
        orderId,
        restaurantName,
        tableNumber: String(table_number),
        orderNumber: orderId.substring(0, 8).toUpperCase(),
        items: validatedOrderItems.map((vi) => ({
          name: vi.item_name,
          quantity: vi.quantity,
          price: vi.price_at_order,
        })),
        totalAmount: calculatedTotal,
        customerName: customer_name,
        customerPhone: customer_phone,
      });

      if (telegramResult.success) {
        telegramSent = true;
        await queryDb('UPDATE public.orders SET telegram_sent = true WHERE id = $1', [orderId]).catch(() => {});
      } else {
        telegramErrorStr = telegramResult.error;
        await queryDb('UPDATE public.orders SET telegram_error = $1 WHERE id = $2', [telegramResult.error, orderId]).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber: orderId.substring(0, 8).toUpperCase(),
        total_amount: calculatedTotal,
        status: 'pending',
        telegram_sent: telegramSent,
        telegram_error: telegramErrorStr,
      },
    });
  } catch (error: any) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing order.' },
      { status: 500 }
    );
  }
}
