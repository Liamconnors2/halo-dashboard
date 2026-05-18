import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfWeek, parseISO } from 'date-fns';
import { generateShootPlan } from '@/lib/week-generator';

const taskInclude = {
  include: {
    pillar: true,
    mediaAssets: true,
    children: { select: { id: true, type: true, done: true } }
  },
  orderBy: [{ dayOfWeek: 'asc' as const }, { order: 'asc' as const }]
};

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (e?.code === 'P1001' || e?.code === 'P1002') {
      await new Promise(r => setTimeout(r, 2000));
      return await fn();
    }
    throw e;
  }
}

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const weekStartParam = searchParams.get('weekStart');

  const weekStart = weekStartParam
    ? startOfWeek(parseISO(weekStartParam), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const isCurrentWeek = !weekStartParam;

  let week = await withRetry(() => prisma.week.findUnique({
    where: { weekStart },
    include: { tasks: taskInclude }
  }));

  // Auto-create current week if it doesn't exist
  if (!week && isCurrentWeek) {
    const created = await prisma.week.create({ data: { weekStart, status: 'active' } });
    const tasks = generateShootPlan();
    for (const t of tasks) {
      await prisma.task.create({
        data: { weekId: created.id, dayOfWeek: t.dayOfWeek, type: t.type, pillarId: t.pillarId, title: t.title, detail: t.detail, brief: t.brief, order: t.order, recipeId: t.recipeId }
      });
    }
    week = await prisma.week.findUnique({ where: { weekStart }, include: { tasks: taskInclude } });
  }

  if (!week) {
    return NextResponse.json({ id: null, weekStart: weekStart.toISOString(), tasks: [], status: 'unplanned' });
  }

  return NextResponse.json(week);
  } catch (e: any) {
    console.error('Week GET error:', e);
    return NextResponse.json({ error: 'Database error', code: e?.code }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.action !== 'regenerate') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const week = await prisma.week.findUnique({ where: { weekStart } });
  if (!week) return NextResponse.json({ error: 'No active week' }, { status: 404 });

  await prisma.task.deleteMany({ where: { weekId: week.id } });
  const tasks = generateShootPlan(body.recipeIds);
  for (const t of tasks) {
    await prisma.task.create({
      data: { weekId: week.id, dayOfWeek: t.dayOfWeek, type: t.type, pillarId: t.pillarId, title: t.title, detail: t.detail, brief: t.brief, order: t.order, recipeId: t.recipeId }
    });
  }

  return NextResponse.json({ success: true, taskCount: tasks.length });
}
