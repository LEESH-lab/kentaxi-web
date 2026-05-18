import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    // 이메일 도메인 검증 (켄텍 이메일만 허용)
    if (!email.endsWith('@kentech.ac.kr')) {
      return NextResponse.json({ message: 'KENTECH 학교 이메일(@kentech.ac.kr)만 가입 가능합니다.' }, { status: 403 });
    }

    // 기존 유저 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 유저 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      },
    });

    return NextResponse.json({ message: '회원가입이 완료되었습니다.', user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
