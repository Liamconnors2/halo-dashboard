import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generatePerformanceInsights, type PillarStat } from '@/lib/anthropic'

const PILLAR_NAMES: Record<number, string> = {
  1: 'Time extension proof',
  2: 'Hair protection',
  3: 'Embarrassed to proud',
  4: 'Founder POV',
  5: 'Ritual & world',
  6: 'Education & authority',
}

export async function GET() {
  try {
    const assets = await prisma.mediaAsset.findMany({
      where: { instagramPostId: { not: null }, pillarId: { not: null } },
      include: { performance: true },
    })

    if (assets.length < 3) {
      return NextResponse.json({ error: 'Not enough data yet — sync more posts first.' }, { status: 400 })
    }

    // Aggregate by pillar
    const byPillar: Record<number, typeof assets> = {}
    for (const a of assets) {
      if (!a.pillarId || !a.performance) continue
      byPillar[a.pillarId] = [...(byPillar[a.pillarId] ?? []), a]
    }

    const stats: PillarStat[] = Object.entries(byPillar).map(([id, posts]) => {
      const perfs = posts.map(p => p.performance!)
      const avg = (arr: (number | null)[]) => {
        const vals = arr.filter((v): v is number => v != null)
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
      }
      const avgF = (arr: (number | null)[]) => {
        const vals = arr.filter((v): v is number => v != null)
        return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null
      }
      const top = posts.sort((a, b) => (b.performance?.reach ?? 0) - (a.performance?.reach ?? 0))[0]
      return {
        pillarId: Number(id),
        pillarName: PILLAR_NAMES[Number(id)] ?? `Pillar ${id}`,
        postCount: posts.length,
        avgReach: avg(perfs.map(p => p.reach)),
        avgLikes: avg(perfs.map(p => p.likes)),
        avgSaves: avg(perfs.map(p => p.saves)),
        avgShares: avg(perfs.map(p => p.shares)),
        avgWatchTime: avgF(perfs.map(p => p.watchTimeAvg)),
        avgSkipRate: avgF(perfs.map(p => p.skipRate)),
        topPost: {
          caption: top.notes?.slice(0, 200) ?? '',
          reach: top.performance?.reach ?? 0,
          saves: top.performance?.saves ?? 0,
        },
      }
    })

    const insights = await generatePerformanceInsights(stats, assets.length)
    return NextResponse.json({ insights, stats })
  } catch (err) {
    console.error('Insights error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
