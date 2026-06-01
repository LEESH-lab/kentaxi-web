import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatKentechName } from "@/lib/kentech";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, image: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Load official KENTECH name based on KENTECH email to enforce locked official identity
    const officialName = formatKentechName(user.email);
    if (user.name !== officialName) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: officialName }
      });
      user.name = officialName;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image },
      select: { id: true, email: true, name: true, image: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update profile image:", error);
    return NextResponse.json({ error: "Failed to update profile image" }, { status: 500 });
  }
}

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
