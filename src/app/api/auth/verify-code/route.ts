import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ message: '이메일과 인증코드를 입력해주세요.' }, { status: 400 });
    }

    const verification = await prisma.emailVerification.findUnique({ where: { email } });

    if (!verification || verification.code !== code) {
      return NextResponse.json({ message: '인증 코드가 올바르지 않습니다.' }, { status: 400 });
    }

    if (verification.expires < new Date()) {
      await prisma.emailVerification.delete({ where: { email } });
      return NextResponse.json({ message: '인증 코드가 만료되었습니다. 다시 발송해주세요.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
