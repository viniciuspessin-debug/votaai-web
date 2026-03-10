import { NextRequest, NextResponse } from 'next/server';

const EMAILJS_SERVICE = 'service_66uw6li';
const EMAILJS_TEMPLATE = 'template_76po9x4';
const EMAILJS_PUBKEY = 'eT0ZVOr7EfY3mr8Ty';

export async function POST(req: NextRequest) {
  try {
    const { from_name, user_email, topic, message } = await req.json();

    if (!topic || !message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE,
        template_id: EMAILJS_TEMPLATE,
        user_id: EMAILJS_PUBKEY,
        template_params: { from_name, user_email, topic, message },
      }),
    });

    const text = await res.text();
    console.log('EmailJS:', res.status, text);

    if (!res.ok) {
      return NextResponse.json({ error: text }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Contato error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
