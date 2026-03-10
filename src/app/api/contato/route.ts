import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { from_name, user_email, topic, message } = await req.json();

    if (!topic || !message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer re_5bKNXwEf_8UnR1rfBxuaJiLpix74fKBRM',
      },
      body: JSON.stringify({
        from: 'VotaAí <onboarding@resend.dev>',
        to: ['pessin@votaai.app'],
        subject: `[VotaAí] ${topic} - ${from_name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6C63FF;">📨 Nova mensagem no VotaAí</h2>
            <table style="width:100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; color: #666;">Assunto</td><td style="padding: 8px;">${topic}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #666;">Nome</td><td style="padding: 8px;">${from_name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #666;">E-mail</td><td style="padding: 8px;">${user_email}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
              <strong>Mensagem:</strong><br/><br/>
              ${message.replace(/\n/g, '<br/>')}
            </div>
          </div>
        `,
      }),
    });

    const data = await res.json();
    console.log('Resend:', res.status, data);

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Erro no envio' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Contato error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
