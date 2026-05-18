import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { addDays } from 'date-fns';
import { getRecipeDownstreamTasks } from '@/lib/week-generator';

const updateSchema = z.object({
  done: z.boolean().optional(),
  skipped: z.boolean().optional(),
  title: z.string().optional(),
  detail: z.string().optional(),
  brief: z.string().optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data = updateSchema.parse(body);
  const updateData: any = { ...data };
  if (data.done !== undefined) updateData.doneAt = data.done ? new Date() : null;

  const task = await prisma.task.update({
    where: { id: params.id },
    data: updateData,
    include: { week: true }
  });

  // When a film task is marked done, auto-create edit+post tasks in the next week
  if (data.done === true && task.type === 'film' && task.recipeId) {
    const existingChildren = await prisma.task.count({ where: { parentTaskId: task.id } });
    if (existingChildren === 0) {
      const downstreamDefs = getRecipeDownstreamTasks(task.recipeId, task.dayOfWeek);
      if (downstreamDefs.length > 0) {
        const nextWeekStart = addDays(task.week.weekStart, 7);
        let nextWeek = await prisma.week.findUnique({ where: { weekStart: nextWeekStart } });
        if (!nextWeek) {
          nextWeek = await prisma.week.create({ data: { weekStart: nextWeekStart, status: 'active' } });
        }
        for (const def of downstreamDefs) {
          await prisma.task.create({
            data: {
              weekId: nextWeek.id,
              dayOfWeek: def.dayOfWeek,
              type: def.type,
              pillarId: def.pillarId,
              title: def.title,
              detail: def.detail,
              brief: def.brief,
              order: 0,
              recipeId: def.recipeId ?? null,
              parentTaskId: task.id,
            }
          });
        }
      }
    }
  }

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
