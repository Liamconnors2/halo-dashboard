'use client';

import { useEffect, useState, useCallback } from 'react';
import { PILLARS, DAY_LABELS, TASK_TYPE_COLOURS } from '@/lib/pillars';
import { format, startOfWeek, addDays, addWeeks, isSameDay } from 'date-fns';

type Task = {
  id: string;
  dayOfWeek: number;
  type: keyof typeof TASK_TYPE_COLOURS;
  pillarId: number | null;
  title: string;
  detail: string;
  brief: string;
  done: boolean;
  skipped: boolean;
  order: number;
  recipeId: string | null;
  parentTaskId: string | null;
  children: Array<{ id: string; type: string; done: boolean }>;
};

type Week = {
  id: string | null;
  weekStart: string;
  tasks: Task[];
  status?: string;
};

type RecipeInfo = { id: string; name: string; pillarId: number; shootType: string; shootDay: number };

type PlanRec = {
  recommendation: {
    recipeIds: string[];
    reasoning: Record<string, string>;
    weekTheme: string;
    priorityPillar: number;
  };
  weekStart: string;
  recipes: RecipeInfo[];
};

const today = new Date();
const todayDow = (today.getDay() + 6) % 7; // Mon=0

function getWeekStart(offset: number): Date {
  const base = startOfWeek(today, { weekStartsOn: 1 });
  return addWeeks(base, offset);
}

export default function WeekPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [week, setWeek] = useState<Week | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeDay, setActiveDay] = useState<number>(todayDow);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showPlan, setShowPlan] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [planRec, setPlanRec] = useState<PlanRec | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const weekStart = getWeekStart(weekOffset);
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const loadWeek = useCallback(() => {
    setLoadError(false);
    fetch(`/api/week?weekStart=${weekStartStr}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setWeek)
      .catch(() => setLoadError(true));
  }, [weekStartStr]);

  useEffect(() => {
    setWeek(null);
    loadWeek();
  }, [loadWeek]);

  // Reset active day when navigating weeks
  useEffect(() => {
    if (weekOffset === 0) setActiveDay(todayDow);
    else setActiveDay(0);
  }, [weekOffset]);

  const monday = getWeekStart(weekOffset);

  const toggleTask = async (id: string, done: boolean) => {
    setWeek(w => w ? { ...w, tasks: w.tasks.map(t => t.id === id ? { ...t, done } : t) } : null);
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done })
    });
    if (res.ok) {
      // Reload week to pick up any newly created downstream tasks
      loadWeek();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTasks(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const openPlanPanel = async () => {
    setShowPlan(true);
    if (!planRec) {
      setPlanLoading(true);
      try {
        const nextWeekStart = format(getWeekStart(weekOffset + 1), 'yyyy-MM-dd');
        const res = await fetch(`/api/week/plan?weekStart=${nextWeekStart}`);
        const data: PlanRec = await res.json();
        setPlanRec(data);
        setSelectedRecipes(new Set(data.recommendation.recipeIds));
      } catch (e) {
        console.error(e);
      }
      setPlanLoading(false);
    }
  };

  const createPlan = async () => {
    if (!planRec || selectedRecipes.size === 0) return;
    setCreating(true);
    try {
      await fetch('/api/week/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeIds: [...selectedRecipes], weekStart: format(getWeekStart(weekOffset + 1), 'yyyy-MM-dd') })
      });
      setShowPlan(false);
      setPlanRec(null);
      setWeekOffset(o => o + 1);
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  };

  if (loadError) return (
    <div className="text-sm text-black/50 flex items-center gap-3">
      <span>Failed to load — database may be waking up.</span>
      <button onClick={loadWeek} className="underline">Retry</button>
    </div>
  );
  if (!week) return <div className="text-sm text-black/50">Loading…</div>;

  const isUnplanned = week.id === null;
  const tasks = week.tasks ?? [];

  const taskCount = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;
  const filmTotal = tasks.filter(t => t.type === 'film').length;
  const filmDone = tasks.filter(t => t.type === 'film' && t.done).length;
  const postCount = tasks.filter(t => t.type === 'post').length;
  const pillarCounts = Object.keys(PILLARS).reduce<Record<number, number>>((acc, k) => { acc[parseInt(k)] = 0; return acc; }, {});
  tasks.forEach(t => { if (t.pillarId) pillarCounts[t.pillarId]++; });

  const dayTasks = tasks.filter(t => t.dayOfWeek === activeDay);
  const dayDate = addDays(monday, activeDay);
  const isCurrentWeek = weekOffset === 0;

  return (
    <div>
      {/* Week navigation header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="text-sm border border-black/15 px-2.5 py-1 rounded-md hover:bg-black/5"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-medium">
              {isCurrentWeek ? 'This week at Halo' : weekOffset === 1 ? 'Next week' : weekOffset < 0 ? `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago` : `${weekOffset} weeks ahead`}
            </h1>
            <p className="text-sm text-black/60">
              {format(monday, 'MMM d')} — {format(addDays(monday, 6), 'MMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="text-sm border border-black/15 px-2.5 py-1 rounded-md hover:bg-black/5"
          >
            →
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs border border-black/15 px-2.5 py-1 rounded-md hover:bg-black/5 text-black/60"
            >
              Today
            </button>
          )}
          {isCurrentWeek && (
            <button
              onClick={openPlanPanel}
              className="text-xs border border-[#013b4a] text-[#013b4a] px-3 py-1.5 rounded-md hover:bg-[#013b4a]/5"
            >
              Plan next week ↗
            </button>
          )}
        </div>
      </header>

      {/* Plan Next Week panel */}
      {showPlan && (
        <div className="bg-[#013b4a]/5 border border-[#013b4a]/20 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-medium">Plan next week</h2>
              <p className="text-xs text-black/60 mt-0.5">
                {format(getWeekStart(weekOffset + 1), 'MMM d')} — {format(addDays(getWeekStart(weekOffset + 1), 6), 'MMM d')}
              </p>
            </div>
            <button onClick={() => setShowPlan(false)} className="text-black/40 hover:text-black text-lg leading-none">✕</button>
          </div>

          {planLoading ? (
            <div className="text-sm text-black/50 py-4">Asking Claude for recommendations…</div>
          ) : planRec ? (
            <>
              <div className="bg-white border border-black/10 rounded-lg p-3 mb-4">
                <p className="text-xs text-black/50 uppercase tracking-wider mb-1">Recommended theme</p>
                <p className="text-sm font-medium">{planRec.recommendation.weekTheme}</p>
              </div>
              <p className="text-xs text-black/60 mb-3">Select the shoots to include next week. Only prep + film tasks are created now — edit/post tasks unlock automatically when you mark each film done.</p>
              <div className="space-y-2 mb-5">
                {planRec.recipes.map(recipe => {
                  const isRecommended = planRec.recommendation.recipeIds.includes(recipe.id);
                  const isSelected = selectedRecipes.has(recipe.id);
                  const pillar = PILLARS[recipe.pillarId as keyof typeof PILLARS];
                  const reasoning = planRec.recommendation.reasoning[recipe.id];
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => setSelectedRecipes(s => {
                        const n = new Set(s);
                        n.has(recipe.id) ? n.delete(recipe.id) : n.add(recipe.id);
                        return n;
                      })}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        isSelected ? 'border-[#013b4a] bg-[#013b4a]/5' : 'border-black/10 bg-white hover:bg-black/3'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-[#013b4a] border-[#013b4a]' : 'border-black/25'}`}>
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{recipe.name}</span>
                            {isRecommended && <span className="text-[10px] bg-[#013b4a] text-white px-1.5 py-0.5 rounded">AI pick</span>}
                            {pillar && <span className="text-[10px]" style={{ color: pillar.text }}>● {pillar.name}</span>}
                          </div>
                          {reasoning && <p className="text-xs text-black/60 mt-0.5">{reasoning}</p>}
                          <p className="text-[10px] text-black/40 mt-0.5">{DAY_LABELS[recipe.shootDay]} · {recipe.shootType}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createPlan}
                  disabled={creating || selectedRecipes.size === 0}
                  className="bg-[#013b4a] text-[#fffff4] px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {creating ? 'Creating…' : `Create plan (${selectedRecipes.size} shoot${selectedRecipes.size !== 1 ? 's' : ''})`}
                </button>
                <button onClick={() => setShowPlan(false)} className="border border-black/15 px-4 py-2 rounded-md text-sm hover:bg-black/5">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-600">Failed to load recommendations. Try again.</p>
          )}
        </div>
      )}

      {/* Unplanned week state */}
      {isUnplanned && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-center">
          <p className="text-sm font-medium text-amber-900 mb-1">No plan for this week yet</p>
          <p className="text-xs text-amber-700 mb-3">Use "Plan next week" from the current week to create a shoot plan here.</p>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs border border-amber-700/30 text-amber-900 px-3 py-1.5 rounded-md hover:bg-amber-100"
          >
            ← Go to current week
          </button>
        </div>
      )}

      {!isUnplanned && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <Stat label="Progress" value={`${Math.round((doneCount / Math.max(taskCount, 1)) * 100)}%`} sub={`${doneCount} of ${taskCount} tasks`} />
            <Stat label="Shoots done" value={`${filmDone}/${filmTotal}`} sub="Sat & Sun anchor" />
            <Stat label="Posts scheduled" value={postCount.toString()} sub="Reels + carousels + stories" />
            <Stat label={isCurrentWeek ? 'Today' : 'Week'} value={isCurrentWeek ? DAY_LABELS[todayDow] : format(monday, 'MMM d')} sub={isCurrentWeek ? dayLabel(todayDow) : ''} />
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-6">
            {DAY_LABELS.map((label, idx) => {
              const tasksForDay = tasks.filter(t => t.dayOfWeek === idx);
              const date = addDays(monday, idx);
              const isShootDay = idx === 5 || idx === 6;
              const isToday = isCurrentWeek && idx === todayDow;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveDay(idx)}
                  className={`p-2 border rounded-md text-center transition ${
                    activeDay === idx ? 'bg-[#013b4a]/10 border-[#013b4a]' :
                    isToday ? 'border-[#013b4a]' :
                    'border-black/15 hover:bg-black/5'
                  } ${isShootDay && idx !== activeDay && !isToday ? 'bg-amber-50/50' : ''}`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-black/50">{label}</div>
                  <div className="text-base font-medium">{format(date, 'd')}</div>
                  <div className="flex gap-0.5 justify-center mt-1.5 min-h-[6px]">
                    {tasksForDay.map((t, i) => (
                      <span key={i} className={`w-1 h-1 rounded-full ${t.done ? 'bg-emerald-600' : t.skipped ? 'bg-black/10' : 'bg-black/20'}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-black/10 rounded-xl p-5 mb-6">
            <h2 className="text-lg font-medium">{DAY_LABELS[activeDay]} — {dayLabel(activeDay)}</h2>
            <p className="text-sm text-black/60 mb-5">{dayNote(activeDay)}</p>
            {dayTasks.length === 0 ? (
              <p className="text-sm text-black/50">No tasks for this day.</p>
            ) : dayTasks.map((t, i) => {
              const pillar = t.pillarId ? PILLARS[t.pillarId as keyof typeof PILLARS] : null;
              const typeColour = TASK_TYPE_COLOURS[t.type];
              const expanded = expandedTasks.has(t.id);
              const hasUndonePrepOrFilm = t.type === 'edit' || t.type === 'post';
              return (
                <div key={t.id} className={`flex gap-3 py-4 ${i > 0 ? 'border-t border-black/10' : ''} ${t.skipped ? 'opacity-40' : ''}`}>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={e => toggleTask(t.id, e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded" style={{ background: typeColour.bg, color: typeColour.text }}>{t.type}</span>
                      {pillar && (
                        <span className="text-[11px]" style={{ color: pillar.text }}>● {pillar.name}</span>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${t.done ? 'line-through text-black/40' : ''}`}>{t.title}</p>
                    <p className="text-xs text-black/60 mt-1">{t.detail}</p>
                    {t.brief && (
                      <>
                        <button onClick={() => toggleExpand(t.id)} className="text-xs text-[#013b4a] mt-2">
                          {expanded ? '↑ Hide brief' : 'View full brief →'}
                        </button>
                        {expanded && (
                          <div className="mt-2 p-3 bg-black/3 rounded text-xs whitespace-pre-wrap leading-relaxed">{t.brief}</div>
                        )}
                      </>
                    )}
                    {/* Show downstream task count for film tasks */}
                    {t.type === 'film' && !t.done && t.recipeId && (
                      <p className="text-[10px] text-black/40 mt-1.5">
                        {t.children.length > 0
                          ? `✓ Edit + post tasks created for next week`
                          : `Mark done to unlock edit + post tasks in next week`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-black/10 rounded-xl p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-sm font-medium">Pillar rotation this week</h3>
              <p className="text-xs text-black/50">Each pillar should get 1+ touch</p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
              {Object.entries(PILLARS).map(([num, p]) => {
                const count = pillarCounts[parseInt(num)];
                return (
                  <div key={num} className="p-2 rounded text-center" style={{ background: count > 0 ? p.color : '#f1efe8' }}>
                    <p className="text-sm font-medium" style={{ color: count > 0 ? p.text : '#888' }}>{num}</p>
                    <p className="text-[10px] leading-tight" style={{ color: count > 0 ? p.text : '#888' }}>{p.name}</p>
                    <p className="text-[9px] mt-1 text-black/40">{count} {count === 1 ? 'touch' : 'touches'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-black/3 rounded-md p-3">
      <p className="text-[10px] uppercase tracking-wider text-black/50">{label}</p>
      <p className="text-lg font-medium mt-1">{value}</p>
      <p className="text-[10px] text-black/40 mt-0.5">{sub}</p>
    </div>
  );
}

function dayLabel(day: number): string {
  const labels = ['Edit + design', 'Big posting', 'Mid-week post + prep', 'Founder reactions', 'Aesthetic + wind-down', 'KEYSTONE SHOOT — Day 1', 'KEYSTONE SHOOT — Day 2'];
  return labels[day] ?? '';
}

function dayNote(day: number): string {
  const notes = [
    'Editing Sat\'s footage. Designed posts only. Engage with reviewers.',
    'Post Sat\'s thermal reel — Tuesday gets highest IG reach.',
    'Optional founder micro. Prep for upcoming shoots.',
    'Post Sun\'s founder reactions. Run the story poll series.',
    'Last posts. Pack tomorrow\'s shoot bag. Plan next week.',
    'Block 9am-3pm. Multiple shoots back-to-back.',
    'Block 9am-2pm. Last shoots + queue next week\'s posts.'
  ];
  return notes[day] ?? '';
}
