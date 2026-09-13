import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgsomwpnnhqkyybdivnx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ error: 'No Telegram bot token' });

  try {
    // Fetch highest update_id from Supabase to persist offset across server restarts
    const { data: maxUpdateRecord } = await supabase
      .from('telegram_updates')
      .select('update_id')
      .order('update_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    let maxUpdateId = maxUpdateRecord?.update_id ? Number(maxUpdateRecord.update_id) : 0;

    // Pass offset = maxUpdateId + 1 to acknowledge processed messages and prevent Telegram re-sending old updates
    const offsetParam = maxUpdateId > 0 ? `?offset=${maxUpdateId + 1}` : '';
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates${offsetParam}`);
    const data = await res.json();

    if (!data.ok || !data.result || !Array.isArray(data.result)) {
      return NextResponse.json({ ok: false, data });
    }

    let processedCount = 0;

    for (const update of data.result) {
      if (update.update_id) {
        maxUpdateId = Math.max(maxUpdateId, update.update_id);
      }

      // Forward update to internal webhook handler
      await fetch('http://localhost:3000/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      }).catch(() => {});

      processedCount++;
    }

    // Explicitly acknowledge highest update_id to Telegram API so Telegram purges them
    if (maxUpdateId > 0) {
      await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${maxUpdateId + 1}`).catch(() => {});
    }

    return NextResponse.json({ ok: true, processedCount, lastProcessedUpdateId: maxUpdateId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
