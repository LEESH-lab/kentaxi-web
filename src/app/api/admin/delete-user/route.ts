import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const email = searchParams.get('email');

  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { email } });
    return NextResponse.json({ success: true, deleted: email });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
