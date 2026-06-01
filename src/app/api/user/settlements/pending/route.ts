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
          isNot: null,
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

    // Format the list of pending settlements
    const formatted = pendingPots.map(pot => {
      const settlement = pot.settlement!;
      const memberCount = pot.users.length;
      const perPerson = Math.ceil(settlement.totalAmount / memberCount);

      return {
        potId: pot.id,
        settlementId: settlement.id,
        from: pot.from,
        to: pot.to,
        departureTime: pot.departureTime,
        meetingTime: pot.meetingTime,
        totalAmount: settlement.totalAmount,
        perPerson,
        accountBank: settlement.accountBank,
        accountNumber: settlement.accountNumber,
        accountHolder: settlement.accountHolder,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch pending settlements:", error);
    return NextResponse.json({ error: "Failed to fetch pending settlements" }, { status: 500 });
  }
}
