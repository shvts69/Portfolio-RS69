// Vercel serverless route — forwards contact form submissions to Telegram bot
// Required env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ error: 'telegram_not_configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const name = String(body.name || '').trim().slice(0, 80);
  const email = String(body.email || '').trim().slice(0, 120);
  const message = String(body.message || '').trim().slice(0, 4000);
  const honeypot = String(body.website || '').trim();

  if (honeypot) return res.status(200).json({ ok: true });
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'bad_email' });
  }

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const text =
    '<b>\u{1F4E1} New RS69 transmission</b>\n\n' +
    '<b>From:</b> ' + esc(name) + '\n' +
    '<b>Email:</b> ' + esc(email) + '\n\n' +
    '<b>Message:</b>\n' + esc(message);

  try {
    const tg = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!tg.ok) {
      const errText = await tg.text().catch(() => '');
      console.error('Telegram error', tg.status, errText);
      return res.status(502).json({ error: 'telegram_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact handler error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
