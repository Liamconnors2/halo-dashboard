import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enrichIdea } from '@/lib/anthropic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pillarId = searchParams.get('pillarId');
  const status = searchParams.get('status');
  const contentType = searchParams.get('contentType');

  const ideas = await prisma.idea.findMany({
    where: {
      ...(pillarId ? { pillarId: parseInt(pillarId) } : {}),
      ...(status ? { status: status as any } : { status: { not: 'archived' } }),
      ...(contentType ? { contentType } : {})
    },
    include: { pillar: true, tasks: { select: { id: true, weekId: true } } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
  });

  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rawDump, contentType = 'reel' } = body as { rawDump: string; contentType?: string };

  if (!rawDump?.trim()) {
    return NextResponse.json({ error: 'rawDump required' }, { status: 400 });
  }

  // Create the idea immediately as 'raw'
  const idea = await prisma.idea.create({
    data: { rawDump: rawDump.trim(), contentType, status: 'raw' }
  });

  // Enrich with Claude
  try {
    const enrichment = await enrichIdea(rawDump);
    const updated = await prisma.idea.update({
      where: { id: idea.id },
      data: {
        title: enrichment.title,
        pillarId: enrichment.pillarId,
        contentType: enrichment.contentType,
        priority: enrichment.priority,
        hook: enrichment.hook,
        hookVariants: enrichment.hookVariants,
        framework: enrichment.framework,
        shootChecklist: enrichment.shootChecklist,
        caption: enrichment.caption,
        tags: enrichment.tags,
        reasoning: enrichment.reasoning,
        status: 'processed'
      },
      include: { pillar: true, tasks: { select: { id: true, weekId: true } } }
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Enrichment failed:', e);
    return NextResponse.json(
      await prisma.idea.findUnique({ where: { id: idea.id }, include: { pillar: true, tasks: { select: { id: true, weekId: true } } } })
    );
  }
}
