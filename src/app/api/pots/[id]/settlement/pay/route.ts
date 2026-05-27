import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST: 납부 완료 토글
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: potId } = await params;
  const userId = session.user.id as string;

  const settlement = await prisma.settlement.findUnique({ where: { potId } });
  if (!settlement) return NextResponse.json({ error: "No settlement" }, { status: 404 });

  const existing = await prisma.payment.findUnique({
    where: { settlementId_userId: { settlementId: settlement.id, userId } },
  });

  if (existing) {
    // 취소
    await prisma.payment.delete({ where: { id: existing.id } });
    return NextResponse.json({ paid: false });
  } else {
    await prisma.payment.create({ data: { settlementId: settlement.id, userId } });

    // 전원 납부 완료 시 settlement completedAt 기록
    const memberCount = await prisma.userOnPot.count({ where: { potId } });
    const paidCount = await prisma.payment.count({ where: { settlementId: settlement.id } });
    if (paidCount >= memberCount) {
      await prisma.settlement.update({
        where: { id: settlement.id },
        data: { completedAt: new Date() },
      });
    }
    return NextResponse.json({ paid: true });
  }
}
