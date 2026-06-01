import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const potId = id;
  const userId = session.user.id as string;

  try {
    // 1. Check if pot exists and has space
    const pot = await prisma.pot.findUnique({
      where: { id: potId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!pot) {
      return NextResponse.json({ error: "Pot not found" }, { status: 404 });
    }

    // 현재 시간 이전(과거)에 이미 모임 시간이 지난 팟은 참여할 수 없도록 차단
    if (new Date(pot.meetingTime).getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "이미 지난 팟에는 참여할 수 없습니다." },
        { status: 400 }
      );
    }

    if (pot._count.users >= pot.capacity) {
      return NextResponse.json({ error: "Pot is full" }, { status: 400 });
    }

    // 2. Check if user is already in this pot
    const existingParticipation = await prisma.userOnPot.findUnique({
      where: {
        userId_potId: {
          userId,
          potId,
        },
      },
    });

    if (existingParticipation) {
      return NextResponse.json({ error: "Already joined" }, { status: 400 });
    }

    // 3. Add user to pot
    await prisma.userOnPot.create({
      data: {
        userId,
        potId,
      },
    });

    // 4. Post a system message so existing members are notified via chat polling
    const joiningUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const displayName = joiningUser?.name || joiningUser?.email?.split('@')[0] || '새 멤버';
    await prisma.message.create({
      data: {
        content: `__JOIN__${displayName}`,
        userId,
        potId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Join error:", error);
    return NextResponse.json({ error: "Failed to join pot" }, { status: 500 });
  }
}
