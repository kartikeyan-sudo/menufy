import { NextResponse } from 'next/server';
import { supabaseAdmin, corsHeaders } from '@/lib/db';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import crypto from 'crypto';

// Default restaurant ID for demo/single-tenant mode
const DEFAULT_RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      // Fetch single order by ID
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .maybeSingle();

      if (error) {
        console.error('GET /api/orders single error:', error.message);
      }

      return NextResponse.json(
        { success: true, order: order || null },
        { headers: corsHeaders }
      );
    }

    // Auto-prune completed/rejected orders older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('orders')
      .delete()
      .in('status', ['completed', 'rejected'])
      .lt('updated_at', oneHourAgo)
      .then(() => {});

    // Fetch active orders (max 3, newest first)
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .not('status', 'in', '("completed","rejected")')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('GET /api/orders list error:', error.message);
      return NextResponse.json(
        { success: true, orders: [] },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, orders: orders || [] },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('GET /api/orders error:', err);
    return NextResponse.json(
      { success: true, orders: [] },
      { headers: corsHeaders }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields (order_id, status).' },
        { status: 400, headers: corsHeaders }
      );
    }

    const validStatuses = ['pending', 'accepted', 'rejected', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update order status in database
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('PATCH /api/orders DB error:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // Auto-prune: delete completed/rejected orders older than 1 hour
    if (status === 'completed' || status === 'rejected') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('orders')
        .delete()
        .in('status', ['completed', 'rejected'])
        .lt('updated_at', oneHourAgo)
        .then(() => {});
    }

    return NextResponse.json(
      { success: true, order_id, status },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('PATCH /api/orders error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurant_id, table_number, customer_name, customer_phone, items } = body;

    if (!table_number || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order details (table_number, items).' },
        { status: 400, headers: corsHeaders }
      );
    }

    const effectiveRestaurantId = restaurant_id || DEFAULT_RESTAURANT_ID;

    // Lookup restaurant for Telegram chat_id
    let restaurantName = 'Restaurant';
    let targetChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID || '';

    const { data: restaurant } = await supabaseAdmin
      .from('restaurants')
      .select('name, telegram_chat_id, telegram_connected')
      .eq('id', effectiveRestaurantId)
      .maybeSingle();

    if (restaurant) {
      restaurantName = restaurant.name || restaurantName;
      if (restaurant.telegram_chat_id && restaurant.telegram_connected) {
        targetChatId = restaurant.telegram_chat_id;
      }
    }

    // Calculate total and validate items
    let calculatedTotal = 0;
    const validatedOrderItems: {
      item_name: string;
      quantity: number;
      price_at_order: number;
      menu_item_id?: string;
    }[] = [];

    for (const item of items) {
      const name = item.item_name || item.name || 'Menu Item';
      const unitPrice = Number(item.price || item.price_at_order || 0);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      calculatedTotal += unitPrice * qty;
      validatedOrderItems.push({
        item_name: name,
        quantity: qty,
        price_at_order: unitPrice,
        menu_item_id: item.menu_item_id || undefined,
      });
    }

    const orderId = crypto.randomUUID();

    // Insert order into database
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        restaurant_id: effectiveRestaurantId,
        table_number: String(table_number),
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        total_amount: calculatedTotal,
        status: 'pending',
        telegram_sent: false,
      });

    if (orderError) {
      console.error('POST /api/orders insert order error:', orderError.message);
      return NextResponse.json(
        { error: `Failed to create order: ${orderError.message}` },
        { status: 500, headers: corsHeaders }
      );
    }

    // Insert order items
    const orderItemsToInsert = validatedOrderItems.map((vi) => ({
      order_id: orderId,
      item_name: vi.item_name,
      quantity: vi.quantity,
      price_at_order: vi.price_at_order,
      menu_item_id: vi.menu_item_id || null,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('POST /api/orders insert items error:', itemsError.message);
      // Order was created but items failed — still return success with warning
    }

    // Dispatch Telegram notification
    let telegramSent = false;
    let telegramErrorStr: string | null = null;

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
        await supabaseAdmin
          .from('orders')
          .update({ telegram_sent: true })
          .eq('id', orderId);
      } else {
        telegramErrorStr = telegramResult.error || null;
        await supabaseAdmin
          .from('orders')
          .update({ telegram_error: telegramResult.error })
          .eq('id', orderId);
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id: orderId,
          orderNumber: orderId.substring(0, 8).toUpperCase(),
          total_amount: calculatedTotal,
          status: 'pending',
          telegram_sent: telegramSent,
          telegram_error: telegramErrorStr,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing order.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
