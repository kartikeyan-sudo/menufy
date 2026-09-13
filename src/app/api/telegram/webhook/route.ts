import { NextResponse } from 'next/server';
import { supabaseAdmin, corsHeaders } from '@/lib/db';
import { sendTelegramMessage, answerCallbackQuery, editTelegramMessageText } from '@/lib/telegram';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // Idempotency: check if this update has already been processed
    const updateId = update.update_id;
    if (updateId) {
      const { data: existing } = await supabaseAdmin
        .from('telegram_updates')
        .select('update_id')
        .eq('update_id', updateId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ ok: true, duplicate: true }, { headers: corsHeaders });
      }

      await supabaseAdmin
        .from('telegram_updates')
        .upsert({ update_id: updateId }, { onConflict: 'update_id' });
    }

    // Handle /start command for Telegram bot connection
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const token = parts[1];

        if (!token) {
          return NextResponse.json({ ok: true }, { headers: corsHeaders });
        }

        // Look up connection token
        const { data: tokenRecord } = await supabaseAdmin
          .from('telegram_connection_tokens')
          .select('*')
          .eq('token', token)
          .maybeSingle();

        if (tokenRecord) {
          // Link chat ID to restaurant
          await supabaseAdmin
            .from('restaurants')
            .update({
              telegram_chat_id: String(chatId),
              telegram_connected: true,
            })
            .eq('id', tokenRecord.restaurant_id);

          // Delete used token
          await supabaseAdmin
            .from('telegram_connection_tokens')
            .delete()
            .eq('token', token);

          await sendTelegramMessage(
            chatId,
            `🎉 <b>Successfully Connected!</b>\n\nThis Telegram chat is now linked to your Menufy restaurant dashboard.\nYou will receive live customer table orders directly here!`
          );
        }

        return NextResponse.json({ ok: true }, { headers: corsHeaders });
      }
    }

    // Handle Inline Action Callbacks (Accept/Reject order buttons)
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

        // *** KEY FIX: Update order status directly in Supabase ***
        // This is the SAME operation as the PATCH /api/orders endpoint
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Telegram webhook order update error:', updateError.message);
        }

        // Auto-prune rejected orders after 1 hour
        if (newStatus === 'rejected') {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          await supabaseAdmin
            .from('orders')
            .delete()
            .in('status', ['completed', 'rejected'])
            .lt('updated_at', oneHourAgo);
        }

        // Answer callback query popup to Telegram user
        await answerCallbackQuery(
          callbackId,
          `Order #${shortToken} ${isAccept ? 'ACCEPTED ✅' : 'REJECTED ❌'}`
        );

        // Edit Telegram message text & clear inline buttons to reflect new status
        if (messageId && chatId) {
          const originalText = callbackQuery.message?.text || '';
          const cleanText = originalText
            .replace(/📌 Status:.*/g, '')
            .replace(/📌 STATUS UPDATE:.*/g, '')
            .trim();
          const updatedText = `${cleanText}\n\n========================================\n📌 <b>STATUS UPDATE:</b> ${statusLabel}`;
          await editTelegramMessageText(chatId, messageId, updatedText, { inline_keyboard: [] });
        }
      }

      return NextResponse.json({ ok: true }, { headers: corsHeaders });
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  }
}
