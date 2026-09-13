import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let restaurantId = '11111111-1111-1111-1111-111111111111'; // default demo restaurant ID if unauthenticated

    if (user) {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      if (restaurant) {
        restaurantId = restaurant.id;
      }
    }

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiration

    // Store token in database
    await supabase.from('telegram_connection_tokens').insert({
      token,
      restaurant_id: restaurantId,
      expires_at: expiresAt,
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'menufy_Orders_Bot';
    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return NextResponse.json({
      success: true,
      token,
      deepLink,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Telegram connect API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate Telegram connection link.' }, { status: 500 });
  }
}
