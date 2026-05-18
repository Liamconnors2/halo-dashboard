import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfWeek, addDays, parseISO } from 'date-fns';
import { generateShootPlan, CONTENT_RECIPES } from '@/lib/week-generator';
import { planNextWeek, type PillarStat } from '@/lib/anthropic';

// GET /api/week/plan?weekStart=YYYY-MM-DD — fetch AI recipe recommendations for a week
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStartParam = searchParams.get('weekStart');
  const targetWeekStart = weekStartParam
    ? startOfWeek(parseISO(weekStartParam), { weekStartsOn: 1 })
    : startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 });

  // Gather pillar performance stats from MediaAsset + Performance
  const assets = await prisma.mediaAsset.findMany({
    where: { pillarId: { not: null }, status: { in: ['posted', 'approved'] } },
    include: { performance: true, pillar: true },
    orderBy: { postedAt: 'desc' },
    take: 50
  });

  const statsByPillar: Record<number, { reaches: number[]; likes: number[]; saves: number[]; shares: number[]; watchTimes: number[]; skipRates: number[]; captions: Array<{ caption: string; reach: number; saves: number }> }> = {};

  for (const asset of assets) {
    const pid = asset.pillarId!;
    if (!statsByPillar[pid]) statsByPillar[pid] = { reaches: [], likes: [], saves: [], shares: [], watchTimes: [], skipRates: [], captions: [] };
    const p = asset.performance;
    if (p?.reach) statsByPillar[pid].reaches.push(p.reach);
    if (p?.likes) statsByPillar[pid].likes.push(p.likes);
    if (p?.saves) statsByPillar[pid].saves.push(p.saves);
    if (p?.shares) statsByPillar[pid].shares.push(p.shares);
    if (p?.watchTimeAvg) statsByPillar[pid].watchTimes.push(p.watchTimeAvg);
    if (p?.skipRate) statsByPillar[pid].skipRates.push(p.skipRate);
    if (p?.reach && asset.scriptText) {
      statsByPillar[pid].captions.push({ caption: asset.scriptText.slice(0, 100), reach: p.reach, saves: p.saves ?? 0 });
    }
  }

  const pillars = await prisma.pillar.findMany();
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const pillarStats: PillarStat[] = pillars.map(p => {
    const s = statsByPillar[p.id] ?? { reaches: [], likes: [], saves: [], shares: [], watchTimes: [], skipRates: [], captions: [] };
    const sortedByReach = s.captions.sort((a, b) => b.reach - a.reach);
    return {
      pillarId: p.id,
      pillarName: p.name,
      postCount: s.reaches.length,
      avgReach: Math.round(avg(s.reaches)),
      avgLikes: Math.round(avg(s.likes)),
      avgSaves: Math.round(avg(s.saves)),
      avgShares: Math.round(avg(s.shares)),
      avgWatchTime: s.watchTimes.length ? avg(s.watchTimes) : null,
      avgSkipRate: s.skipRates.length ? avg(s.skipRates) : null,
      topPost: sortedByReach[0] ?? { caption: '', reach: 0, saves: 0 }
    };
  });

  // Find recent recipe usage (last 2 weeks)
  const twoWeeksAgo = addDays(targetWeekStart, -14);
  const recentTasks = await prisma.task.findMany({
    where: { recipeId: { not: null }, createdAt: { gte: twoWeeksAgo } },
    select: { recipeId: true }
  });
  const recentRecipeIds = [...new Set(recentTasks.map(t => t.recipeId!))];

  const availableRecipes = CONTENT_RECIPES.map(r => ({ id: r.id, name: r.name, pillarId: r.pillarId }));

  const recommendation = await planNextWeek(pillarStats, recentRecipeIds, availableRecipes);

  return NextResponse.json({
    recommendation,
    weekStart: targetWeekStart.toISOString(),
    recipes: CONTENT_RECIPES.map(r => ({ id: r.id, name: r.name, pillarId: r.pillarId, shootType: r.shoot.type, shootDay: r.shoot.dayOfWeek }))
  });
}

// POST /api/week/plan — create a week plan with chosen recipes
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { recipeIds, weekStart: weekStartStr } = body as { recipeIds: string[]; weekStart: string };

  if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
    return NextResponse.json({ error: 'recipeIds required' }, { status: 400 });
  }

  const weekStart = weekStartStr
    ? startOfWeek(parseISO(weekStartStr), { weekStartsOn: 1 })
    : startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 });

  let week = await prisma.week.findUnique({ where: { weekStart } });
  if (week) {
    // Replace existing tasks for a re-plan
    await prisma.task.deleteMany({ where: { weekId: week.id } });
  } else {
    week = await prisma.week.create({ data: { weekStart, status: 'active' } });
  }

  const tasks = generateShootPlan(recipeIds);
  for (const t of tasks) {
    await prisma.task.create({
      data: { weekId: week.id, dayOfWeek: t.dayOfWeek, type: t.type, pillarId: t.pillarId, title: t.title, detail: t.detail, brief: t.brief, order: t.order, recipeId: t.recipeId }
    });
  }

  return NextResponse.json({ success: true, weekId: week.id, weekStart: weekStart.toISOString(), taskCount: tasks.length });
}
