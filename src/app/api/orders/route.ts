import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      const orderRes = await queryDb('SELECT * FROM public.orders WHERE id = $1', [orderId]);
      if (orderRes.rows.length === 0) {
        return NextResponse.json({ success: true, order: null });
      }
      const order = orderRes.rows[0];
      const itemsRes = await queryDb('SELECT * FROM public.order_items WHERE order_id = $1', [orderId]);
      order.order_items = itemsRes.rows;
      return NextResponse.json({ success: true, order });
    }

    // Auto-prune completed/rejected orders to prevent storage overflow
    await queryDb(`
      DELETE FROM public.orders 
      WHERE status IN ('completed', 'rejected') 
         OR id NOT IN (SELECT id FROM public.orders ORDER BY created_at DESC LIMIT 3)
    `).catch(() => {});

    // Fetch maximum 3 latest active orders
    const ordersRes = await queryDb('SELECT * FROM public.orders ORDER BY created_at DESC LIMIT 3');
    const orders = ordersRes.rows;

    if (orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id);
      const itemsRes = await queryDb('SELECT * FROM public.order_items WHERE order_id = ANY($1)', [orderIds]);
      const itemsMap = new Map();
      itemsRes.rows.forEach((item: any) => {
        if (!itemsMap.has(item.order_id)) itemsMap.set(item.order_id, []);
        itemsMap.get(item.order_id).push(item);
      });

      orders.forEach((o: any) => {
        o.order_items = itemsMap.get(o.id) || [];
      });
    }

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error('GET /api/orders error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Missing required fields (order_id, status).' }, { status: 400 });
    }

    const res = await queryDb(
      'UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, order_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = res.rows[0];

    // If completed or rejected, auto-clean from database to prevent storage overflow
    if (status === 'completed' || status === 'rejected') {
      await queryDb(`DELETE FROM public.orders WHERE id = $1 OR status IN ('completed', 'rejected')`, [order_id]).catch(() => {});
    }

    const itemsRes = await queryDb('SELECT * FROM public.order_items WHERE order_id = $1', [order_id]);
    order.order_items = itemsRes.rows;

    return NextResponse.json({ success: true, order });
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
      if (restRes.rows.length > 0) {
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
    let orderStatus = 'pending';

    try {
      // Auto-prune old completed/rejected orders to maintain maximum 3 active orders in DB
      await queryDb(`
        DELETE FROM public.orders 
        WHERE status IN ('completed', 'rejected') 
           OR id NOT IN (SELECT id FROM public.orders ORDER BY created_at DESC LIMIT 2)
      `).catch(() => {});

      const orderRes = await queryDb(
        `INSERT INTO public.orders (id, restaurant_id, table_number, customer_name, customer_phone, total_amount, status, telegram_sent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [orderId, restaurant_id, String(table_number), customer_name || null, customer_phone || null, calculatedTotal, 'pending', false]
      );

      if (orderRes && orderRes.rows && orderRes.rows.length > 0) {
        orderStatus = orderRes.rows[0].status || 'pending';
      }

      for (const vi of validatedOrderItems) {
        await queryDb(
          `INSERT INTO public.order_items (order_id, item_name, quantity, price_at_order)
           VALUES ($1, $2, $3, $4)`,
          [orderId, vi.item_name, vi.quantity, vi.price_at_order]
        );
      }
    } catch (dbErr: any) {
      console.warn('Postgres order insertion warning (proceeding with Telegram notification):', dbErr.message);
    }

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
        await queryDb('UPDATE public.orders SET telegram_sent = true WHERE id = $1', [orderId]);
      } else {
        telegramErrorStr = telegramResult.error;
        await queryDb('UPDATE public.orders SET telegram_error = $1 WHERE id = $2', [telegramResult.error, orderId]);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber: orderId.substring(0, 8).toUpperCase(),
        total_amount: calculatedTotal,
        status: orderStatus,
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
