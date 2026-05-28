import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, code: string) {
  const { error } = await resend.emails.send({
    from: '켄택시 <onboarding@resend.dev>',
    to,
    subject: '[켄택시] 이메일 인증 코드',
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px;">
        <h2 style="color:#1e2b4d;margin-bottom:8px;">켄택시 이메일 인증</h2>
        <p style="color:#555;margin-bottom:24px;">아래 6자리 인증 코드를 입력해 가입을 완료하세요.</p>
        <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#1e2b4d;background:#f4f5f9;border-radius:16px;text-align:center;padding:24px 16px;margin-bottom:20px;">
          ${code}
        </div>
        <p style="color:#aaa;font-size:12px;">이 코드는 10분간 유효합니다. 본인이 요청하지 않았다면 무시하세요.</p>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
}
