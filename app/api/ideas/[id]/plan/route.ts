import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfWeek, addDays } from 'date-fns';

const CONTENT_TYPE_DEFAULTS: Record<string, { type: 'film' | 'edit' | 'post' | 'prep' | 'engage'; dayOfWeek: number }> = {
  reel: { type: 'film', dayOfWeek: 5 },  // Saturday shoot
  ad:   { type: 'film', dayOfWeek: 5 },  // Saturday shoot
  carousel: { type: 'post', dayOfWeek: 0 }, // Monday design
  story:    { type: 'post', dayOfWeek: 3 }, // Thursday stories
  hook:     { type: 'prep', dayOfWeek: 4 }, // Friday planning
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const { weekOffset = 1 } = body as { weekOffset?: number };

  const idea = await prisma.idea.findUnique({ where: { id: params.id } });
  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Find target week
  const base = startOfWeek(new Date(), { weekStartsOn: 1 });
  const targetWeekStart = addDays(base, weekOffset * 7);

  let week = await prisma.week.findUnique({ where: { weekStart: targetWeekStart } });
  if (!week) {
    week = await prisma.week.create({ data: { weekStart: targetWeekStart, status: 'active' } });
  }

  const defaults = CONTENT_TYPE_DEFAULTS[idea.contentType] ?? CONTENT_TYPE_DEFAULTS.reel;

  // Build brief from framework + checklist
  const brief = [
    idea.framework ?? '',
    idea.shootChecklist?.length ? '\n\nPRE-SHOOT CHECKLIST:\n' + idea.shootChecklist.map(i => `□ ${i}`).join('\n') : '',
    idea.caption ? '\n\nSUGGESTED CAPTION:\n' + idea.caption : ''
  ].join('');

  const task = await prisma.task.create({
    data: {
      weekId: week.id,
      dayOfWeek: defaults.dayOfWeek,
      type: defaults.type,
      pillarId: idea.pillarId,
      title: idea.title || idea.rawDump.slice(0, 80),
      detail: idea.hook ?? idea.rawDump.slice(0, 120),
      brief,
      order: 99,
      ideaId: idea.id
    }
  });

  await prisma.idea.update({
    where: { id: idea.id },
    data: { status: 'planned' }
  });

  return NextResponse.json({ success: true, task, weekStart: targetWeekStart.toISOString() });
}
