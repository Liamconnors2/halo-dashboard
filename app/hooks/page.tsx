'use client';

import { useEffect, useState } from 'react';
import { PILLARS } from '@/lib/pillars';

type Hook = {
  id: string;
  text: string;
  source: string;
  pillarId: number;
  tags: string[];
  timesUsed: number;
  pillar: { name: string };
};

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [pillarFilter, setPillarFilter] = useState<string>('');

  useEffect(() => {
    const url = pillarFilter ? `/api/hooks?pillarId=${pillarFilter}` : '/api/hooks';
    fetch(url).then(r => r.json()).then(setHooks);
  }, [pillarFilter]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-medium">Hook bank</h1>
        <p className="text-sm text-black/60">Real customer language. Use these as opening lines for reels and posts.</p>
      </header>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button onClick={() => setPillarFilter('')} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${!pillarFilter ? 'bg-[#013b4a] text-white' : 'bg-black/5'}`}>All</button>
        {Object.entries(PILLARS).map(([id, p]) => (
          <button key={id} onClick={() => setPillarFilter(id)} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${pillarFilter === id ? 'text-white' : ''}`} style={pillarFilter === id ? { background: p.text } : { background: p.color, color: p.text }}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hooks.map(h => {
          const p = PILLARS[h.pillarId as keyof typeof PILLARS];
          return (
            <div key={h.id} className="bg-white border border-black/10 rounded-xl p-4">
              <p className="text-sm font-medium italic">"{h.text}"</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-black/60">— {h.source}</p>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: p.color, color: p.text }}>{p.name}</span>
              </div>
              {h.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">{h.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 bg-black/5 rounded">{t}</span>)}</div>
              )}
            </div>
          );
        })}
        {hooks.length === 0 && <p className="text-sm text-black/50">No hooks yet. Sync reviews from Settings.</p>}
      </div>
    </div>
  );
}
