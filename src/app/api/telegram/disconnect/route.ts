import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let restaurantId = '11111111-1111-1111-1111-111111111111';

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

    await supabase
      .from('restaurants')
      .update({
        telegram_connected: false,
        telegram_chat_id: null,
      })
      .eq('id', restaurantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to disconnect Telegram.' }, { status: 500 });
  }
}
