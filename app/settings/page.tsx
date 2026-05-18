'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [igSyncing, setIgSyncing] = useState(false);
  const [igResult, setIgResult] = useState<string>('');

  const syncInstagram = async () => {
    setIgSyncing(true);
    setIgResult('');
    try {
      const r = await fetch('/api/instagram/sync', { method: 'POST' });
      const data = await r.json();
      if (data.error) setIgResult(`Error: ${data.error}`);
      else setIgResult(`Synced ${data.total} posts (${data.created} new, ${data.updated} updated)`);
    } catch (e: any) {
      setIgResult(`Error: ${e.message}`);
    }
    setIgSyncing(false);
  };

  const syncFromAPI = async () => {
    setSyncing(true);
    setResult('');
    try {
      const r = await fetch('/api/reviews/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await r.json();
      if (data.error) setResult(`Error: ${data.error}`);
      else setResult(`Synced ${data.total} reviews (${data.imported} new, ${data.updated} updated)`);
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    }
    setSyncing(false);
  };

  const syncFromCSV = async (file: File) => {
    setSyncing(true);
    const fd = new FormData();
    fd.append('csv', file);
    const r = await fetch('/api/reviews/sync', { method: 'POST', body: fd });
    const data = await r.json();
    setResult(data.error ? `Error: ${data.error}` : `Imported ${data.total} reviews`);
    setSyncing(false);
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-medium">Settings</h1>
      </header>

      <section className="bg-white border border-black/10 rounded-xl p-5 mb-4">
        <h2 className="text-base font-medium mb-2">Review sync</h2>
        <p className="text-sm text-black/60 mb-4">Pull the latest reviews from Loox. New hooks auto-extracted.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={syncFromAPI} disabled={syncing} className="bg-[#013b4a] text-[#fffff4] px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50">
            {syncing ? 'Syncing…' : 'Sync from Loox API'}
          </button>
          <label className="border border-black/15 px-4 py-2 rounded-md text-sm font-medium cursor-pointer hover:bg-black/5">
            Upload CSV instead
            <input type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) syncFromCSV(f); }} className="hidden" />
          </label>
        </div>
        {result && <p className="text-xs mt-3 text-black/70">{result}</p>}
      </section>

      <section className="bg-white border border-black/10 rounded-xl p-5 mb-4">
        <h2 className="text-base font-medium mb-1">Instagram metrics</h2>
        <p className="text-sm text-black/60 mb-4">Pull views, likes, shares, saves, watch time and reach for all @thehalo.au posts.</p>
        <button onClick={syncInstagram} disabled={igSyncing} className="bg-[#013b4a] text-[#fffff4] px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50">
          {igSyncing ? 'Syncing…' : 'Sync Instagram metrics'}
        </button>
        {igResult && <p className="text-xs mt-3 text-black/70">{igResult}</p>}
      </section>

      <section className="bg-white border border-black/10 rounded-xl p-5 mb-4">
        <h2 className="text-base font-medium mb-2">Regenerate this week</h2>
        <p className="text-sm text-black/60 mb-4">Wipe all tasks and re-create from the latest recipe definitions. Useful after editing content recipes.</p>
        <button
          onClick={async () => {
            if (!confirm('This will delete all tasks in this week (including your check-marks). Continue?')) return;
            const r = await fetch('/api/week', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'regenerate' }) });
            const data = await r.json();
            alert(data.success ? `Regenerated with ${data.taskCount} tasks` : `Error: ${data.error}`);
          }}
          className="border border-black/15 px-4 py-2 rounded-md text-sm font-medium hover:bg-black/5"
        >
          Regenerate week
        </button>
      </section>

      <section className="bg-white border border-black/10 rounded-xl p-5">
        <h2 className="text-base font-medium mb-2">Help</h2>
        <ul className="text-sm text-black/70 space-y-1.5 list-disc list-inside">
          <li>Loox API key: get from Loox admin → Settings → API</li>
          <li>CSV fallback: Loox admin → Manage Reviews → Export</li>
          <li>R2 setup: see README for full Cloudflare instructions</li>
        </ul>
      </section>
    </div>
  );
}
