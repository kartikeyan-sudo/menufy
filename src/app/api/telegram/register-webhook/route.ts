import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/db';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/telegram/register-webhook — Register Telegram webhook URL
// Call this once after deploying to Vercel to enable push-based Telegram updates
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN not configured' },
      { status: 500, headers: corsHeaders }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://menufy-beryl.vercel.app';
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  try {
    // Register webhook with Telegram
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
    );
    const data = await res.json();

    if (data.ok) {
      return NextResponse.json(
        {
          success: true,
          message: `Webhook registered successfully at ${webhookUrl}`,
          telegram_response: data,
        },
        { headers: corsHeaders }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: data.description || 'Failed to register webhook',
          telegram_response: data,
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
