import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const MASK_AFTER_DAYS = 7;

function maskAccount(accountNumber: string): string {
  // "110-1234-5678" → "110-****-**78"
  return accountNumber.replace(/\d(?=\d{2})/g, "*");
}

function shouldMaskNow(departureTime: Date): boolean {
  return Date.now() > departureTime.getTime() + MASK_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

// GET: 정산 정보 조회
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: potId } = await params;

  const pot = await prisma.pot.findUnique({
    where: { id: potId },
    include: {
      settlement: { include: { payments: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } } },
      users: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
    },
  });

  if (!pot) return NextResponse.json({ error: "Pot not found" }, { status: 404 });

  // 팟 멤버만 접근 가능
  const isMember = pot.users.some(u => u.userId === session.user!.id);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!pot.settlement) return NextResponse.json(null);

  const masked = shouldMaskNow(pot.departureTime);
  const memberCount = pot.users.length;
  const perPerson = Math.ceil(pot.settlement.totalAmount / memberCount);

  return NextResponse.json({
    id: pot.settlement.id,
    totalAmount: pot.settlement.totalAmount,
    perPerson,
    memberCount,
    accountBank: pot.settlement.accountBank,
    accountHolder: pot.settlement.accountHolder,
    accountNumber: masked ? maskAccount(pot.settlement.accountNumber) : pot.settlement.accountNumber,
    isMasked: masked,
    createdAt: pot.settlement.createdAt,
    completedAt: pot.settlement.completedAt,
    payments: pot.settlement.payments,
    isCreator: pot.creatorId === session.user!.id,
    members: pot.users.map(u => u.user),
  });
}

// POST: 정산 등록/수정 (방장만)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: potId } = await params;
  const pot = await prisma.pot.findUnique({ where: { id: potId } });

  if (!pot) return NextResponse.json({ error: "Pot not found" }, { status: 404 });
  if (pot.creatorId !== session.user.id) return NextResponse.json({ error: "Only creator can set settlement" }, { status: 403 });

  const { totalAmount, accountBank, accountNumber, accountHolder } = await req.json();

  const settlement = await prisma.settlement.upsert({
    where: { potId },
    create: { potId, totalAmount, accountBank, accountNumber, accountHolder },
    update: { totalAmount, accountBank, accountNumber, accountHolder },
  });

  return NextResponse.json(settlement);
}

// DELETE: 정산 취소/삭제 (방장만). 납부 기록까지 함께 제거한다.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: potId } = await params;
  const pot = await prisma.pot.findUnique({ where: { id: potId } });

  if (!pot) return NextResponse.json({ error: "Pot not found" }, { status: 404 });
  if (pot.creatorId !== session.user.id) {
    return NextResponse.json({ error: "방장만 정산을 취소할 수 있습니다." }, { status: 403 });
  }

  const settlement = await prisma.settlement.findUnique({ where: { potId } });
  if (!settlement) return NextResponse.json({ error: "정산 내역이 없습니다." }, { status: 404 });

  // payment는 settlement를 참조하므로 먼저 삭제한 뒤 settlement를 삭제한다.
  await prisma.$transaction([
    prisma.payment.deleteMany({ where: { settlementId: settlement.id } }),
    prisma.settlement.delete({ where: { id: settlement.id } }),
  ]);

  return NextResponse.json({ success: true });
}
