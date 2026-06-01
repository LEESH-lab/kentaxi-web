import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultBank: true, defaultAccount: true, defaultHolder: true }
  });

  return NextResponse.json(user);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { defaultBank, defaultAccount, defaultHolder } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      defaultBank,
      defaultAccount,
      defaultHolder
    }
  });

  return NextResponse.json({ success: true });
}
