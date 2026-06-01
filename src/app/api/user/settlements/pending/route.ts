import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Query pots that the user has joined, where a settlement is active,
    // not yet fully settled (completedAt is null), and the user hasn't paid yet (none in payments)
    const pendingPots = await prisma.pot.findMany({
      where: {
        users: {
          some: { userId }
        },
        settlement: {
          completedAt: null,
          payments: {
            none: { userId }
          }
        }
      },
      include: {
        settlement: true,
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: {
        departureTime: "desc"
      }
    });

    // Format the list of pending settlements using dynamic casting to bypass strict type inference
    const formatted = pendingPots.map(pot => {
      const p = pot as any;
      const settlement = p.settlement;
      if (!settlement) return null;
      
      const memberCount = p.users?.length || 1;
      const perPerson = Math.ceil(settlement.totalAmount / memberCount);

      return {
        potId: p.id,
        settlementId: settlement.id,
        from: p.from,
        to: p.to,
        departureTime: p.departureTime,
        meetingTime: p.meetingTime,
        totalAmount: settlement.totalAmount,
        perPerson,
        accountBank: settlement.accountBank,
        accountNumber: settlement.accountNumber,
        accountHolder: settlement.accountHolder,
      };
    }).filter(Boolean);

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch pending settlements:", error);
    return NextResponse.json({ error: "Failed to fetch pending settlements" }, { status: 500 });
  }
}
