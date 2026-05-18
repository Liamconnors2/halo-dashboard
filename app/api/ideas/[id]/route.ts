import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enrichIdea } from '@/lib/anthropic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    include: { pillar: true, tasks: { select: { id: true, weekId: true, type: true, done: true } } }
  });
  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(idea);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { reEnrich, ...data } = body;

  if (reEnrich) {
    const idea = await prisma.idea.findUnique({ where: { id: params.id } });
    if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const enrichment = await enrichIdea(idea.rawDump);
    const updated = await prisma.idea.update({
      where: { id: params.id },
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
  }

  const updated = await prisma.idea.update({
    where: { id: params.id },
    data,
    include: { pillar: true, tasks: { select: { id: true, weekId: true } } }
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.idea.update({ where: { id: params.id }, data: { status: 'archived' } });
  return NextResponse.json({ success: true });
}
