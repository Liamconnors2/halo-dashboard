import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const pillarId = req.nextUrl.searchParams.get('pillarId');
  const tag = req.nextUrl.searchParams.get('tag');
  const where: any = {};
  if (pillarId) where.pillarId = parseInt(pillarId);
  if (tag) where.tags = { has: tag };

  const hooks = await prisma.hook.findMany({
    where,
    include: { pillar: true, review: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return NextResponse.json(hooks);
}
