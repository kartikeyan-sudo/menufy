export interface TelegramOrderNotificationPayload {
  orderId: string;
  restaurantName: string;
  tableNumber: string;
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
}

export async function sendTelegramOrderNotification(
  chatId: string,
  payload: TelegramOrderNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN is not configured.' };
  }

  const itemsFormatted = payload.items
    .map((item) => `  • <b>${item.name}</b> × ${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const text = `
🎟️ <b>TOKEN / ORDER ID: #${payload.orderNumber}</b>

🏪 <b>Restaurant:</b> ${payload.restaurantName}
🪑 <b>Table Number:</b> ${payload.tableNumber}
${payload.customerName ? `👤 <b>Customer Name:</b> ${payload.customerName}\n` : ''}${payload.customerPhone ? `📞 <b>Customer Phone:</b> ${payload.customerPhone}\n` : ''}
<b>Ordered Items:</b>
${itemsFormatted}

----------------------------------------
💰 <b>TOTAL PAYMENT AMOUNT:</b> ₹${payload.totalAmount.toFixed(2)}
⏰ <b>Time:</b> ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}

📌 <b>Status:</b> 🟡 Pending Staff Confirmation
  `.trim();

  // Inline action buttons: [ ✅ Accept Order ] [ ❌ Reject Order ]
  const inlineKeyboard = [
    [
      { text: '✅ Accept Order', callback_data: `accept_${payload.orderId}` },
      { text: '❌ Reject Order', callback_data: `reject_${payload.orderId}` },
    ],
  ];

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.description || 'Failed to dispatch Telegram message',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Telegram network request failed',
    };
  }
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { success: false, error: 'No Telegram bot token' };

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    const data = await response.json();
    return { success: data.ok, error: data.description };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: true,
      }),
    });
  } catch (err) {
    console.error('Failed to answer callback query:', err);
  }
}

export async function editTelegramMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: any
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    const payload: any = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup !== undefined) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data.ok) {
      // Fallback without parse_mode if HTML parsing fails
      const fallbackPayload: any = {
        chat_id: chatId,
        message_id: messageId,
        text: text.replace(/<[^>]*>/g, ''),
      };
      if (replyMarkup !== undefined) {
        fallbackPayload.reply_markup = replyMarkup;
      }
      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload),
      });
    }
  } catch (err) {
    console.error('Failed to edit message text:', err);
  }
}
