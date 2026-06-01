import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Perform cleanup inside a database transaction to ensure transactional integrity
    await prisma.$transaction([
      // 1. Delete user memberships in taxi pools
      prisma.userOnPot.deleteMany({
        where: { userId }
      }),
      // 2. Delete user's payment logs
      prisma.payment.deleteMany({
        where: { userId }
      }),
      // 3. Delete user's chat messages
      prisma.message.deleteMany({
        where: { userId }
      }),
      // 4. Delete associated auth accounts and sessions
      prisma.account.deleteMany({
        where: { userId }
      }),
      prisma.session.deleteMany({
        where: { userId }
      }),
      // 5. Finally, delete the User record
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete user account:", error);
    return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
  }
}
