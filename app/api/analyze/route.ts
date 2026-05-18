import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeContent } from '@/lib/anthropic';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { mediaAssetId, contentType, description } = await req.json();

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    include: { pillar: true, task: true }
  });
  if (!asset || !asset.pillar) {
    return NextResponse.json({ error: 'Asset or pillar not found' }, { status: 404 });
  }

  let imageBase64: string | undefined;
  let imageMimeType: string | undefined;

  if (asset.mimeType.startsWith('image/')) {
    const r = await fetch(asset.publicUrl);
    const buf = await r.arrayBuffer();
    imageBase64 = Buffer.from(buf).toString('base64');
    imageMimeType = asset.mimeType;
  }

  const result = await analyzeContent({
    pillarId: asset.pillar.id,
    pillarName: asset.pillar.name,
    pillarIntent: asset.pillar.intent,
    contentType: contentType || 'reel',
    description: description || asset.notes || asset.task?.title || asset.filename,
    scriptText: asset.scriptText || undefined,
    imageBase64,
    imageMimeType
  });

  const updated = await prisma.mediaAsset.update({
    where: { id: mediaAssetId },
    data: {
      status: 'claude_reviewed',
      aiReview: JSON.stringify(result),
      aiScore: result.scoreOverall,
      aiReviewedAt: new Date()
    }
  });

  return NextResponse.json({ asset: updated, review: result });
}
