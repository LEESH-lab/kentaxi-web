import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const potId = searchParams.get('potId'); // 'GLOBAL_OPEN_CHAT' or actual ID

  const messages = await prisma.message.findMany({
    where: { potId: potId === 'GLOBAL_OPEN_CHAT' ? null : potId },
    include: { user: { select: { id: true, name: true, image: true, email: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100 // Limit to recent 100 messages to prevent overload
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { content, potId } = await request.json();
    
    if (!content) return new NextResponse("Missing content", { status: 400 });

    const message = await prisma.message.create({
      data: {
        content,
        userId: session.user.id,
        potId: potId === 'GLOBAL_OPEN_CHAT' ? null : potId
      },
      include: { user: { select: { id: true, name: true, image: true, email: true } } }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Chat Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
