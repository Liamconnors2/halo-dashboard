import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchLooxReviewsViaAPI, fetchLooxReviewsViaCSV, parseLooxCSV } from '@/lib/loox';

export const maxDuration = 60;

function classifyReview(text: string): { themes: string[], pillarId: number | null, contentPotential: number } {
  const lower = text.toLowerCase();
  const themes: string[] = [];
  let pillarId: number | null = null;
  let contentPotential = 1;
  if (/\b(longer|extend|stay in|push through|last longer|double|twice as long|min)\b/.test(lower)) { themes.push('duration'); pillarId = 1; contentPotential += 2; }
  if (/\b(hair|scalp|curls|colou?r.treated|dye|blonde|frizz|stylist)\b/.test(lower)) { themes.push('hair'); if (!pillarId) pillarId = 2; contentPotential += 2; }
  if (/\b(look|style|embarrass|gnome|viking|design|aesthetic)\b/.test(lower)) { themes.push('looks'); if (!pillarId) pillarId = 3; contentPotential += 1; }
  if (/\b(recovery|training|workout|gym|muscle)\b/.test(lower)) { themes.push('recovery'); contentPotential += 1; }
  if (/\b(sleep|skin|inflammation|immune|stress|breath)\b/.test(lower)) { themes.push('wellness'); contentPotential += 1; }
  if (/\b(gift|bought for|husband|wife|daughter|mom|mum|dad)\b/.test(lower)) { themes.push('gift'); contentPotential += 1; }
  if (/\b(used to|before|now|since|gone from|from \d)\b/.test(lower)) { themes.push('before_after'); contentPotential += 2; }
  if (/\b(spit fire|game changer|life.changing|incredible|amazing)\b/.test(lower)) { themes.push('high_emotion'); contentPotential += 3; }
  if (/\b\d+\s*(min|minute)/.test(lower) && /\b(now|to|from)\b/.test(lower)) { themes.push('specific_numbers'); contentPotential += 2; }
  return { themes, pillarId, contentPotential: Math.min(contentPotential, 10) };
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  let reviews;

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const csvFile = formData.get('csv') as File;
      const csv = await csvFile.text();
      reviews = parseLooxCSV(csv);
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.csvUrl) reviews = await fetchLooxReviewsViaCSV(body.csvUrl);
      else reviews = await fetchLooxReviewsViaAPI();
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  let imported = 0, updated = 0;
  for (const r of reviews) {
    if (!r.reviewText.trim()) continue;
    const classification = classifyReview(r.reviewText);
    const existing = await prisma.review.findUnique({ where: { id: r.id } });
    await prisma.review.upsert({
      where: { id: r.id },
      update: { themes: classification.themes, pillarId: classification.pillarId, contentPotential: classification.contentPotential },
      create: {
        id: r.id,
        rating: r.rating,
        email: r.email,
        nickname: r.nickname,
        fullName: r.fullName,
        reviewText: r.reviewText,
        reviewDate: new Date(r.reviewDate),
        imageUrl: r.imageUrl,
        verifiedPurchase: r.verifiedPurchase,
        duration: r.duration,
        themes: classification.themes,
        pillarId: classification.pillarId,
        contentPotential: classification.contentPotential
      }
    });
    if (existing) updated++; else imported++;
  }

  return NextResponse.json({ success: true, imported, updated, total: reviews.length });
}
