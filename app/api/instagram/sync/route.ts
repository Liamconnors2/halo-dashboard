import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchRecentPosts, fetchPostInsights } from '@/lib/instagram'
import { classifyPostToPillar } from '@/lib/anthropic'

export async function POST() {
  try {
    const posts = await fetchRecentPosts(50)
    let created = 0
    let updated = 0

    for (const post of posts) {
      const insights = await fetchPostInsights(post.id, post.media_type)
      const isReel = post.media_type === 'REEL' || post.media_type === 'VIDEO'
      const avgWatchMs = insights.ig_reels_avg_watch_time ?? 0

      // Auto-classify into pillar if there's a caption
      let pillarId: number | null = null
      try {
        pillarId = await classifyPostToPillar(post.caption ?? '')
      } catch {
        // classification failure is non-fatal
      }

      const asset = await prisma.mediaAsset.upsert({
        where: { instagramPostId: post.id },
        create: {
          instagramPostId: post.id,
          filename: `ig_${post.id}`,
          mimeType: isReel ? 'video/mp4' : 'image/jpeg',
          sizeBytes: 0,
          r2Key: '',
          publicUrl: post.media_url ?? post.thumbnail_url ?? '',
          thumbnailUrl: post.thumbnail_url ?? post.media_url,
          status: 'posted',
          notes: post.caption ?? '',
          postedAt: new Date(post.timestamp),
          pillarId,
        },
        update: {
          notes: post.caption ?? '',
          publicUrl: post.media_url ?? post.thumbnail_url ?? '',
          thumbnailUrl: post.thumbnail_url ?? post.media_url,
          postedAt: new Date(post.timestamp),
          // Only update pillarId if not already manually set
          ...(pillarId ? { pillarId } : {}),
        },
      })

      const perfData = {
        platform: 'instagram',
        views: insights.views ?? 0,
        likes: insights.likes ?? 0,
        comments: insights.comments ?? 0,
        shares: insights.shares ?? 0,
        saves: insights.saved ?? 0,
        reach: insights.reach ?? 0,
        follows: insights.follows ?? 0,
        watchTimeAvg: avgWatchMs > 0 ? avgWatchMs / 1000 : null,
        skipRate: insights.reels_skip_rate ?? null,
        loggedAt: new Date(),
      }

      const existing = await prisma.performance.findUnique({ where: { mediaAssetId: asset.id } })
      if (existing) {
        await prisma.performance.update({ where: { mediaAssetId: asset.id }, data: perfData })
        updated++
      } else {
        await prisma.performance.create({ data: { ...perfData, mediaAssetId: asset.id } })
        created++
      }
    }

    return NextResponse.json({ ok: true, created, updated, total: posts.length })
  } catch (err) {
    console.error('Instagram sync error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
