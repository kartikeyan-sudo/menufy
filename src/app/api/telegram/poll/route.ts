import { NextResponse } from 'next/server';
import { supabaseAdmin, corsHeaders } from '@/lib/db';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'No Telegram bot token configured' }, { headers: corsHeaders });
  }

  try {
    // Fetch highest update_id from Supabase to persist offset across server restarts
    const { data: maxUpdateRecord } = await supabaseAdmin
      .from('telegram_updates')
      .select('update_id')
      .order('update_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    let maxUpdateId = maxUpdateRecord?.update_id ? Number(maxUpdateRecord.update_id) : 0;

    // Pass offset = maxUpdateId + 1 to acknowledge processed messages
    const offsetParam = maxUpdateId > 0 ? `?offset=${maxUpdateId + 1}` : '';
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates${offsetParam}`);
    const data = await res.json();

    if (!data.ok || !data.result || !Array.isArray(data.result)) {
      return NextResponse.json({ ok: false, data }, { headers: corsHeaders });
    }

    let processedCount = 0;

    // Use dynamic APP_URL for webhook forwarding (works on both localhost and Vercel)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://menufy-beryl.vercel.app';

    for (const update of data.result) {
      if (update.update_id) {
        maxUpdateId = Math.max(maxUpdateId, update.update_id);
      }

      // Forward update to internal webhook handler
      await fetch(`${appUrl}/api/telegram/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      }).catch((err) => {
        console.error('Failed to forward telegram update:', err.message);
      });

      processedCount++;
    }

    // Explicitly acknowledge highest update_id to Telegram API
    if (maxUpdateId > 0) {
      await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${maxUpdateId + 1}`).catch(() => {});
    }

    return NextResponse.json(
      { ok: true, processedCount, lastProcessedUpdateId: maxUpdateId },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { headers: corsHeaders });
  }
}
