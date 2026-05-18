'use client';

import { useEffect, useState, useRef } from 'react';
import { PILLARS, TASK_TYPE_COLOURS } from '@/lib/pillars';
import { format } from 'date-fns';

type Idea = {
  id: string;
  rawDump: string;
  title: string;
  pillarId: number | null;
  pillar: { name: string; colorHex: string; textHex: string } | null;
  contentType: string;
  status: 'raw' | 'processed' | 'planned' | 'filmed' | 'archived';
  hook: string | null;
  hookVariants: string[];
  framework: string | null;
  shootChecklist: string[];
  caption: string | null;
  priority: number;
  tags: string[];
  reasoning: string | null;
  tasks: Array<{ id: string; weekId: string }>;
  createdAt: string;
};

const TYPE_COLOURS: Record<string, { bg: string; text: string }> = {
  reel:     { bg: '#FDE8D8', text: '#8B3E15' },
  carousel: { bg: '#E8F0FE', text: '#1A4FB5' },
  story:    { bg: '#F3E8FD', text: '#6B21A8' },
  ad:       { bg: '#FEF3C7', text: '#92400E' },
  hook:     { bg: '#ECFDF5', text: '#065F46' },
};

const STATUS_LABEL: Record<string, string> = {
  raw: 'Unprocessed',
  processed: 'In vault',
  planned: 'Planned',
  filmed: 'Filmed',
  archived: 'Archived',
};

const CONTENT_TYPES = ['reel', 'carousel', 'story', 'ad', 'hook'];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dumping, setDumping] = useState(false);
  const [rawDump, setRawDump] = useState('');
  const [contentType, setContentType] = useState('reel');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterPillar, setFilterPillar] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [planningId, setPlanningId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadIdeas();
  }, []);

  async function loadIdeas() {
    setLoading(true);
    const res = await fetch('/api/ideas');
    const data = await res.json();
    setIdeas(data);
    setLoading(false);
  }

  async function submitIdea() {
    if (!rawDump.trim()) return;
    setDumping(true);
    // Add a placeholder card immediately
    const placeholder: Idea = {
      id: '__placeholder__',
      rawDump,
      title: '',
      pillarId: null,
      pillar: null,
      contentType,
      status: 'raw',
      hook: null,
      hookVariants: [],
      framework: null,
      shootChecklist: [],
      caption: null,
      priority: 0,
      tags: [],
      reasoning: null,
      tasks: [],
      createdAt: new Date().toISOString()
    };
    setIdeas(prev => [placeholder, ...prev]);
    setRawDump('');

    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawDump: placeholder.rawDump, contentType })
    });
    const enriched = await res.json();
    setIdeas(prev => prev.map(i => i.id === '__placeholder__' ? enriched : i));
    setDumping(false);
  }

  async function addToWeek(ideaId: string, offset: number) {
    setPlanningId(ideaId);
    const res = await fetch(`/api/ideas/${ideaId}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekOffset: offset })
    });
    const data = await res.json();
    if (data.success) {
      setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, status: 'planned' } : i));
    }
    setPlanningId(null);
  }

  async function archiveIdea(ideaId: string) {
    await fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' });
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
  }

  function toggleExpand(id: string) {
    setExpandedIds(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const filtered = ideas.filter(i => {
    if (i.id === '__placeholder__') return true;
    if (filterPillar && i.pillarId !== filterPillar) return false;
    if (filterType && i.contentType !== filterType) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-medium">Idea Dump</h1>
        <p className="text-sm text-black/60 mt-0.5">Drop an idea — Claude develops it into a full brief and stores it in your vault.</p>
      </header>

      {/* Dump input */}
      <div className="bg-white border border-black/10 rounded-xl p-5 mb-6">
        <textarea
          ref={textareaRef}
          value={rawDump}
          onChange={e => setRawDump(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitIdea(); }}
          placeholder="What's the idea? Be as rough as you like — a sentence, a vibe, a hook you heard, a format you want to try. Claude will turn it into a production brief."
          rows={4}
          className="w-full text-sm resize-none outline-none placeholder:text-black/30 leading-relaxed"
          disabled={dumping}
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/8">
          <div className="flex gap-1.5">
            {CONTENT_TYPES.map(t => {
              const col = TYPE_COLOURS[t];
              return (
                <button
                  key={t}
                  onClick={() => setContentType(t)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition ${contentType === t ? 'ring-1 ring-black/20' : 'opacity-50 hover:opacity-80'}`}
                  style={{ background: col.bg, color: col.text }}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-black/30">⌘↩ to submit</span>
            <button
              onClick={submitIdea}
              disabled={dumping || !rawDump.trim()}
              className="bg-[#013b4a] text-[#fffff4] px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-40"
            >
              {dumping ? 'Developing…' : 'Develop idea →'}
            </button>
          </div>
        </div>
      </div>

      {/* Vault header + filters */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-medium">Idea vault <span className="text-black/40 font-normal text-sm">({filtered.filter(i => i.id !== '__placeholder__').length})</span></h2>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {/* Status filter */}
          {(['processed', 'planned'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? null : s)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${filterStatus === s ? 'bg-[#013b4a] text-white border-[#013b4a]' : 'border-black/15 hover:bg-black/5'}`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
          {/* Type filter */}
          {CONTENT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(filterType === t ? null : t)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${filterType === t ? 'border-black/40 bg-black/8' : 'border-black/15 hover:bg-black/5'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Pillar filter row */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {Object.entries(PILLARS).map(([num, p]) => (
          <button
            key={num}
            onClick={() => setFilterPillar(filterPillar === parseInt(num) ? null : parseInt(num))}
            className={`text-[11px] px-2.5 py-1 rounded-full transition ${filterPillar === parseInt(num) ? 'ring-1 ring-black/30' : 'opacity-50 hover:opacity-80'}`}
            style={{ background: p.color, color: p.text }}
          >
            {num} · {p.name}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {loading ? (
        <p className="text-sm text-black/40">Loading vault…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-black/30">
          <p className="text-3xl mb-3">💡</p>
          <p className="text-sm">No ideas yet. Dump your first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              expanded={expandedIds.has(idea.id)}
              onToggle={() => toggleExpand(idea.id)}
              onAddToWeek={addToWeek}
              onArchive={archiveIdea}
              isPlanning={planningId === idea.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({
  idea,
  expanded,
  onToggle,
  onAddToWeek,
  onArchive,
  isPlanning,
}: {
  idea: Idea;
  expanded: boolean;
  onToggle: () => void;
  onAddToWeek: (id: string, offset: number) => void;
  onArchive: (id: string) => void;
  isPlanning: boolean;
}) {
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const isPlaceholder = idea.id === '__placeholder__';
  const typeCol = TYPE_COLOURS[idea.contentType] ?? TYPE_COLOURS.reel;
  const pillar = idea.pillarId ? PILLARS[idea.pillarId as keyof typeof PILLARS] : null;

  if (isPlaceholder) {
    return (
      <div className="bg-white border border-black/10 rounded-xl p-5 flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-[#013b4a] border-t-transparent animate-spin flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">Developing idea…</p>
          <p className="text-xs text-black/50 mt-0.5 line-clamp-1">{idea.rawDump}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-xl transition ${idea.status === 'planned' ? 'border-emerald-200' : 'border-black/10'}`}>
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Priority badge */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idea.priority >= 8 ? 'bg-red-100 text-red-700' : idea.priority >= 6 ? 'bg-amber-100 text-amber-700' : 'bg-black/5 text-black/40'}`}>
            {idea.priority || '—'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: typeCol.bg, color: typeCol.text }}>{idea.contentType}</span>
              {pillar && (
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: pillar.color, color: pillar.text }}>
                  {idea.pillarId} · {pillar.name}
                </span>
              )}
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                idea.status === 'planned' ? 'bg-emerald-100 text-emerald-700' :
                idea.status === 'processed' ? 'bg-blue-50 text-blue-600' :
                'bg-black/5 text-black/40'
              }`}>
                {STATUS_LABEL[idea.status]}
              </span>
              {idea.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] text-black/40">#{t}</span>
              ))}
            </div>

            <p className="text-sm font-medium leading-snug">
              {idea.title || <span className="text-black/40 italic">Processing…</span>}
            </p>

            {idea.hook && (
              <p className="text-xs text-[#013b4a] mt-1.5 italic">"{idea.hook}"</p>
            )}

            {idea.reasoning && (
              <p className="text-xs text-black/50 mt-1.5 leading-relaxed">{idea.reasoning}</p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-black/30">{format(new Date(idea.createdAt), 'MMM d')}</span>
            <button
              onClick={onToggle}
              className="text-xs text-black/40 hover:text-black px-2 py-1 rounded hover:bg-black/5"
            >
              {expanded ? '↑' : 'Brief →'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded brief */}
      {expanded && (
        <div className="border-t border-black/8 px-4 pb-4 pt-4 space-y-4">
          {idea.hookVariants.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Hook variants</p>
              <div className="space-y-1.5">
                {idea.hookVariants.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[10px] text-black/30 mt-0.5 flex-shrink-0">{String.fromCharCode(65 + i)}</span>
                    <p className="text-xs italic text-[#013b4a]">"{h}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {idea.framework && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Production brief</p>
              <p className="text-xs leading-relaxed text-black/70 whitespace-pre-wrap">{idea.framework}</p>
            </div>
          )}

          {idea.shootChecklist.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Pre-shoot checklist</p>
              <ul className="space-y-1">
                {idea.shootChecklist.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <span className="text-black/30 flex-shrink-0">□</span>
                    <span className="text-black/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {idea.caption && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Suggested caption</p>
              <p className="text-xs text-black/60 leading-relaxed whitespace-pre-wrap bg-black/3 rounded p-3">{idea.caption}</p>
            </div>
          )}

          {/* Original dump */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-black/30 mb-1">Original dump</p>
            <p className="text-xs text-black/40 italic">"{idea.rawDump}"</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {idea.status !== 'archived' && (
        <div className="border-t border-black/8 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {idea.status === 'processed' && (
              <>
                {showWeekPicker ? (
                  <div className="flex gap-1.5 items-center">
                    <span className="text-xs text-black/50">Add to:</span>
                    {[1, 2, 3].map(offset => (
                      <button
                        key={offset}
                        disabled={isPlanning}
                        onClick={() => { onAddToWeek(idea.id, offset); setShowWeekPicker(false); }}
                        className="text-xs bg-[#013b4a] text-white px-2.5 py-1 rounded-md disabled:opacity-50"
                      >
                        {offset === 1 ? 'Next week' : `+${offset} weeks`}
                      </button>
                    ))}
                    <button onClick={() => setShowWeekPicker(false)} className="text-xs text-black/40 hover:text-black">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowWeekPicker(true)}
                    className="text-xs bg-[#013b4a] text-[#fffff4] px-3 py-1.5 rounded-md font-medium hover:bg-[#013b4a]/90"
                  >
                    Include in content plan →
                  </button>
                )}
              </>
            )}
            {idea.status === 'planned' && (
              <span className="text-xs text-emerald-700 flex items-center gap-1.5">
                <span>✓</span> Added to content plan
              </span>
            )}
          </div>
          <button
            onClick={() => onArchive(idea.id)}
            className="text-[11px] text-black/30 hover:text-red-500"
          >
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
