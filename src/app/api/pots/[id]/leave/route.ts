import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(
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
    const existingParticipation = await prisma.userOnPot.findUnique({
      where: {
        userId_potId: { userId, potId },
      },
    });

    if (!existingParticipation) {
      return NextResponse.json({ error: "Not in this pot" }, { status: 400 });
    }

    await prisma.userOnPot.delete({
      where: {
        userId_potId: { userId, potId },
      },
    });

    // Check the number of remaining members in the pot
    const remainingCount = await prisma.userOnPot.count({
      where: { potId }
    });

    if (remainingCount === 0) {
      // Perform cascading cleanup inside a database transaction to delete empty pot
      await prisma.$transaction([
        prisma.message.deleteMany({ where: { potId } }),
        prisma.payment.deleteMany({ where: { settlement: { potId } } }),
        prisma.settlement.deleteMany({ where: { potId } }),
        prisma.pot.delete({ where: { id: potId } })
      ]);
      return NextResponse.json({ success: true, deleted: true });
    }

    const leavingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const displayName = leavingUser?.name || leavingUser?.email?.split('@')[0] || '멤버';
    await prisma.message.create({
      data: {
        content: `__LEAVE__${displayName}`,
        userId,
        potId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leave error:", error);
    return NextResponse.json({ error: "Failed to leave pot" }, { status: 500 });
  }
}
