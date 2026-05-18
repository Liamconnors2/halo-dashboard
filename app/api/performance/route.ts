import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const assets = await prisma.mediaAsset.findMany({
    where: { instagramPostId: { not: null } },
    include: {
      performance: { select: { views: true, reach: true, likes: true, comments: true, shares: true, saves: true, follows: true, watchTimeAvg: true, skipRate: true } },
      pillar: { select: { id: true, name: true } },
    },
    orderBy: { postedAt: 'desc' },
  })
  return NextResponse.json({ assets })
}
