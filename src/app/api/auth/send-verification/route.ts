import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.endsWith('@kentech.ac.kr')) {
      return NextResponse.json({ message: 'KENTECH 이메일(@kentech.ac.kr)만 가입 가능합니다.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerification.upsert({
      where: { email },
      update: { code, expires },
      create: { email, code, expires },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Send verification error:', error);
    const detail = error?.message || String(error);
    return NextResponse.json({ message: `이메일 전송에 실패했습니다: ${detail}` }, { status: 500 });
  }
}
