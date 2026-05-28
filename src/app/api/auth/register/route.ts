import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, name, code } = await req.json();

    if (!email || !password || !code) {
      return NextResponse.json({ message: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    if (!email.endsWith('@kentech.ac.kr')) {
      return NextResponse.json({ message: 'KENTECH 학교 이메일(@kentech.ac.kr)만 가입 가능합니다.' }, { status: 403 });
    }

    const verification = await prisma.emailVerification.findUnique({ where: { email } });

    if (!verification || verification.code !== code) {
      return NextResponse.json({ message: '인증 코드가 올바르지 않습니다.' }, { status: 400 });
    }

    if (verification.expires < new Date()) {
      await prisma.emailVerification.delete({ where: { email } });
      return NextResponse.json({ message: '인증 코드가 만료되었습니다. 다시 발송해주세요.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        emailVerified: new Date(),
      },
    });

    await prisma.emailVerification.delete({ where: { email } });

    return NextResponse.json(
      { message: '회원가입이 완료되었습니다.', user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
