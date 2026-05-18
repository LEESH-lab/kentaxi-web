import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pot = await prisma.pot.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!pot) {
      return NextResponse.json({ error: "Pot not found" }, { status: 404 });
    }

    return NextResponse.json(pot);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pot" }, { status: 500 });
  }
}
