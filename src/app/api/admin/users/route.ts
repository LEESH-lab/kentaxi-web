import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";

// GET: 전체 가입 회원 목록 (관리자 전용). 비밀번호 해시는 절대 반환하지 않는다.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      defaultBank: true,
      defaultAccount: true,
      createdAt: true,
      _count: { select: { pots: true, payments: true, messages: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ count: users.length, users });
}
