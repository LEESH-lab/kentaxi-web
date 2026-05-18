import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const now = new Date();
    const pots = await prisma.pot.findMany({
      where: {
        status: "OPEN",
        meetingTime: {
          gt: now, // Only future pots
        },
      },
      include: {
        users: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        meetingTime: "asc",
      },
    });

    return NextResponse.json(pots);
  } catch (error) {
    console.error("Error fetching pots:", error);
    return NextResponse.json({ error: "Failed to fetch pots" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { trainType, trainNumber, departureTime, from, to } = body;

    // Automated Logic: meetingTime is 30 mins before departureTime
    // departureTime is now ISO string
    const depDate = new Date(departureTime);
    const meetingDate = new Date(depDate.getTime() - 30 * 60000);
    
    const pot = await prisma.pot.create({
      data: {
        trainType,
        trainNumber,
        departureTime: depDate,
        meetingTime: meetingDate,
        from,
        to,
        users: {
          create: {
            userId: session.user.id as string,
          },
        },
      },
    });

    return NextResponse.json(pot);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create pot" }, { status: 500 });
  }
}
