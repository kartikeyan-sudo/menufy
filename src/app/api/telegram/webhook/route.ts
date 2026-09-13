import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage, answerCallbackQuery, editTelegramMessageText } from '@/lib/telegram';

// Service role Supabase client for webhook database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgsomwpnnhqkyybdivnx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // 1. Webhook Idempotency Guard (Fix #6)
    const updateId = update.update_id;
    if (updateId) {
      const { data: existingUpdate } = await supabase
        .from('telegram_updates')
        .select('update_id')
        .eq('update_id', updateId)
        .maybeSingle();

      if (existingUpdate) {
        // Already processed update - return 200 OK without re-triggering actions
        return NextResponse.json({ ok: true, duplicate: true });
      }

      // Mark update_id as processed
      await supabase.from('telegram_updates').upsert({ update_id: updateId }, { onConflict: 'update_id' });
    }

    // 2. Handle explicit connection command (/start <connection_token>) ONLY
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const token = parts[1];

        // Do not send greeting for bare /start command to prevent message spam
        if (!token) {
          return NextResponse.json({ ok: true });
        }

        // Look up connection token in database
        const { data: tokenRecord } = await supabase
          .from('telegram_connection_tokens')
          .select('token, restaurant_id, expires_at')
          .eq('token', token)
          .maybeSingle();

        if (tokenRecord) {
          // Map chat_id to restaurant
          const { data: restaurant } = await supabase
            .from('restaurants')
            .update({
              telegram_chat_id: String(chatId),
              telegram_connected: true,
            })
            .eq('id', tokenRecord.restaurant_id)
            .select('name')
            .single();

          // Delete token after successful single use
          await supabase.from('telegram_connection_tokens').delete().eq('token', token);

          // Send ONE connection greeting
          await sendTelegramMessage(
            chatId,
            `🎉 <b>Successfully Connected!</b>\n\nThis Telegram chat is now linked to <b>${restaurant?.name || 'Sharma Cafe'}</b>.\nYou will receive live customer table orders directly here!`
          );
        }

        return NextResponse.json({ ok: true });
      }
    }

    // 3. Handle Inline Action Callbacks ([ ✅ Accept Order ] [ ❌ Reject Order ])
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

        // Update database order status (Supabase is single source of truth)
        try {
          await supabase
            .from('orders')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', orderId);
        } catch (dbErr) {
          console.warn('Database order status update skipped:', dbErr);
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
          // Pass inline_keyboard: [] to remove Accept/Reject buttons after action
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
