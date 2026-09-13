import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage, answerCallbackQuery, editTelegramMessageText } from '@/lib/telegram';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgsomwpnnhqkyybdivnx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const update = await req.json();

    const updateId = update.update_id;
    if (updateId) {
      try {
        const checkRes = await queryDb('SELECT update_id FROM public.telegram_updates WHERE update_id = $1', [updateId]);
        if (checkRes && checkRes.rows && checkRes.rows.length > 0) {
          return NextResponse.json({ ok: true, duplicate: true });
        }
        await queryDb('INSERT INTO public.telegram_updates (update_id) VALUES ($1) ON CONFLICT DO NOTHING', [updateId]);
      } catch {}
    }

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const token = parts[1];

        if (!token) {
          return NextResponse.json({ ok: true });
        }

        try {
          const tokenRes = await queryDb('SELECT * FROM public.telegram_connection_tokens WHERE token = $1', [token]);
          if (tokenRes && tokenRes.rows && tokenRes.rows.length > 0) {
            const tokenRecord = tokenRes.rows[0];
            await queryDb('UPDATE public.restaurants SET telegram_chat_id = $1, telegram_connected = true WHERE id = $2', [String(chatId), tokenRecord.restaurant_id]);
            await queryDb('DELETE FROM public.telegram_connection_tokens WHERE token = $1', [token]);

            await sendTelegramMessage(
              chatId,
              `🎉 <b>Successfully Connected!</b>\n\nThis Telegram chat is now linked to your Menufy restaurant dashboard.\nYou will receive live customer table orders directly here!`
            );
          }
        } catch {}

        return NextResponse.json({ ok: true });
      }
    }

    // Handle Inline Action Callbacks ([ ✅ Accept Order ] [ ❌ Reject Order ])
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const callbackId = callbackQuery.id;
      const data = callbackQuery.data;
      const chatId = callbackQuery.message?.chat?.id;
      const messageId = callbackQuery.message?.message_id;

      if (data.startsWith('accept_') || data.startsWith('reject_')) {
        const isAccept = data.startsWith('accept_');
        const orderId = data.replace(isAccept ? 'accept_' : 'reject_', '');
        const shortToken = orderId.substring(0, 8).toUpperCase();

        const newStatus = isAccept ? 'accepted' : 'rejected';
        const statusLabel = isAccept ? '✅ ORDER ACCEPTED BY STAFF' : '❌ ORDER REJECTED BY STAFF';

        // Update database order status using native Postgres queryDb and internal PATCH
        try {
          await queryDb(
            'UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2 OR id LIKE $3',
            [newStatus, orderId, `${orderId}%`]
          );

          if (newStatus === 'rejected') {
            await queryDb(`DELETE FROM public.orders WHERE id = $1 OR status IN ('completed', 'rejected')`, [orderId]).catch(() => {});
          }

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          await fetch(`${appUrl}/api/orders`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: newStatus }),
          }).catch(() => {});
        } catch (dbErr) {
          console.warn('Postgres Telegram order status update skipped:', dbErr);
        }

        // Answer callback query popup to Telegram user
        await answerCallbackQuery(
          callbackId,
          `Order #${shortToken} ${isAccept ? 'ACCEPTED ✅' : 'REJECTED ❌'}`
        );

        // Edit Telegram message text & clear inline buttons to reflect new status
        if (messageId && chatId) {
          const originalText = callbackQuery.message?.text || '';
          const cleanText = originalText.replace(/📌 Status:.*/g, '').replace(/📌 STATUS UPDATE:.*/g, '').trim();
          const updatedText = `${cleanText}\n\n========================================\n📌 <b>STATUS UPDATE:</b> ${statusLabel}`;
          await editTelegramMessageText(chatId, messageId, updatedText, { inline_keyboard: [] });
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
