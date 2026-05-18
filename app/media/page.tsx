'use client';

import { useEffect, useState } from 'react';
import { PILLARS } from '@/lib/pillars';

type MediaAsset = {
  id: string;
  filename: string;
  mimeType: string;
  publicUrl: string;
  pillarId: number | null;
  status: 'draft' | 'claude_reviewed' | 'approved' | 'posted' | 'archived';
  scriptText: string | null;
  notes: string | null;
  aiReview: string | null;
  aiScore: number | null;
  createdAt: string;
  pillar: { id: number; name: string } | null;
};

type AIReview = {
  scoreOverall: number;
  scoreHook: number;
  scorePillar: number;
  scoreCustomerVoice: number;
  scoreBrand: number;
  scoreConversion: number;
  whatWorks: string[];
  whatDoesnt: string[];
  specificFixes: string[];
  rawFeedback: string;
};

export default function MediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analysingId, setAnalysingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [activeReview, setActiveReview] = useState<{ asset: MediaAsset; review: AIReview } | null>(null);

  useEffect(() => { refresh(); }, []);

  const refresh = async () => {
    const r = await fetch('/api/media');
    setAssets(await r.json());
  };

  const upload = async (file: File, pillarId: string, notes: string, scriptText: string) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    if (pillarId) fd.append('pillarId', pillarId);
    if (notes) fd.append('notes', notes);
    if (scriptText) fd.append('scriptText', scriptText);
    await fetch('/api/media', { method: 'POST', body: fd });
    setUploading(false);
    refresh();
  };

  const analyse = async (assetId: string) => {
    setAnalysingId(assetId);
    const asset = assets.find(a => a.id === assetId);
    const r = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaAssetId: assetId,
        contentType: asset?.mimeType.startsWith('video/') ? 'reel' : 'image',
        description: asset?.notes || asset?.filename
      })
    });
    const data = await r.json();
    setAnalysingId(null);
    if (data.review) setActiveReview({ asset: data.asset, review: data.review });
    refresh();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/media/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    await fetch(`/api/media/${id}`, { method: 'DELETE' });
    refresh();
  };

  const filtered = filter === 'all' ? assets : assets.filter(a => a.status === filter);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-medium">Media bank</h1>
        <p className="text-sm text-black/60">Upload drafts. Get Claude's review. Track to live.</p>
      </header>

      <UploadForm onUpload={upload} uploading={uploading} />

      <div className="flex gap-2 mb-4 mt-6 overflow-x-auto">
        {['all', 'draft', 'claude_reviewed', 'approved', 'posted'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${filter === f ? 'bg-[#013b4a] text-white' : 'bg-black/5'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(asset => (
          <AssetCard key={asset.id} asset={asset} onAnalyse={analyse} onStatus={updateStatus} onRemove={remove} onViewReview={() => {
            if (asset.aiReview) setActiveReview({ asset, review: JSON.parse(asset.aiReview) });
          }} analysing={analysingId === asset.id} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-black/50">No assets yet.</p>}
      </div>

      {activeReview && <ReviewModal review={activeReview.review} asset={activeReview.asset} onClose={() => setActiveReview(null)} onApprove={(id: string) => { updateStatus(id, 'approved'); setActiveReview(null); }} />}
    </div>
  );
}

function UploadForm({ onUpload, uploading }: { onUpload: (f: File, p: string, n: string, s: string) => void; uploading: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [pillarId, setPillarId] = useState('');
  const [notes, setNotes] = useState('');
  const [scriptText, setScriptText] = useState('');

  const submit = () => {
    if (!file) return;
    onUpload(file, pillarId, notes, scriptText);
    setFile(null); setPillarId(''); setNotes(''); setScriptText('');
  };

  return (
    <div className="bg-white border border-black/10 rounded-xl p-4">
      <div className="flex flex-col gap-3">
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept="image/*,video/*,.txt,.md" className="text-sm" />
        <select value={pillarId} onChange={e => setPillarId(e.target.value)} className="text-sm border border-black/10 rounded px-2 py-1.5">
          <option value="">Select pillar…</option>
          {Object.entries(PILLARS).map(([id, p]) => <option key={id} value={id}>Pillar {id} — {p.name}</option>)}
        </select>
        <input type="text" placeholder="Notes (e.g. 'Thermal demo reel, draft 2')" value={notes} onChange={e => setNotes(e.target.value)} className="text-sm border border-black/10 rounded px-2 py-1.5" />
        <textarea placeholder="Script / caption (optional)" value={scriptText} onChange={e => setScriptText(e.target.value)} rows={3} className="text-sm border border-black/10 rounded px-2 py-1.5" />
        <button onClick={submit} disabled={!file || uploading} className="bg-[#013b4a] text-[#fffff4] px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 self-start">
          {uploading ? 'Uploading…' : 'Upload to bank'}
        </button>
      </div>
    </div>
  );
}

function AssetCard({ asset, onAnalyse, onStatus, onRemove, onViewReview, analysing }: any) {
  const isImage = asset.mimeType.startsWith('image/');
  const isVideo = asset.mimeType.startsWith('video/');
  const pillar = asset.pillarId ? PILLARS[asset.pillarId as keyof typeof PILLARS] : null;
  return (
    <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
      <div className="aspect-video bg-black/5 flex items-center justify-center">
        {isImage && <img src={asset.publicUrl} alt={asset.filename} className="w-full h-full object-cover" />}
        {isVideo && <video src={asset.publicUrl} controls className="w-full h-full object-cover" />}
        {!isImage && !isVideo && <span className="text-xs text-black/40">📄 {asset.filename}</span>}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded bg-black/5">{asset.status.replace('_', ' ')}</span>
          {pillar && <span className="text-[11px]" style={{ color: pillar.text }}>● {pillar.name}</span>}
          {asset.aiScore !== null && <span className="text-[11px] text-emerald-700">★ {asset.aiScore}/10</span>}
        </div>
        <p className="text-sm font-medium truncate">{asset.filename}</p>
        {asset.notes && <p className="text-xs text-black/60 mt-1 line-clamp-2">{asset.notes}</p>}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {asset.status === 'draft' && (
            <button onClick={() => onAnalyse(asset.id)} disabled={analysing || !asset.pillarId} className="text-xs border border-black/15 px-2 py-1 rounded hover:bg-black/5 disabled:opacity-40">
              {analysing ? 'Analysing…' : 'Get Claude review'}
            </button>
          )}
          {asset.aiReview && <button onClick={onViewReview} className="text-xs border border-black/15 px-2 py-1 rounded hover:bg-black/5">View review</button>}
          {asset.status !== 'posted' && asset.status !== 'archived' && (
            <button onClick={() => onStatus(asset.id, asset.status === 'approved' ? 'posted' : 'approved')} className="text-xs border border-black/15 px-2 py-1 rounded hover:bg-black/5">
              {asset.status === 'approved' ? 'Mark posted' : 'Approve'}
            </button>
          )}
          <button onClick={() => onRemove(asset.id)} className="text-xs text-red-700 px-2 py-1 rounded hover:bg-red-50">Delete</button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ review, asset, onClose, onApprove }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-2 md:p-4" onClick={onClose}>
      <div className="bg-[#fffff4] max-w-2xl w-full rounded-xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Claude's review</h2>
          <button onClick={onClose} className="text-sm text-black/50">close ✕</button>
        </div>
        <div className="bg-black/5 p-3 rounded-md text-center mb-4">
          <div className="text-3xl font-medium">{review.scoreOverall}/10</div>
          <div className="text-xs text-black/60 mt-1">Overall score</div>
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { l: 'Hook', v: review.scoreHook },
            { l: 'Pillar', v: review.scorePillar },
            { l: 'Voice', v: review.scoreCustomerVoice },
            { l: 'Brand', v: review.scoreBrand },
            { l: 'Convert', v: review.scoreConversion }
          ].map((s, i) => (
            <div key={i} className="text-center bg-black/3 rounded p-2">
              <div className="text-sm font-medium">{s.v}</div>
              <div className="text-[9px] text-black/50">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-emerald-700">What works</h3>
          <ul className="text-sm space-y-1">{review.whatWorks.map((s: string, i: number) => <li key={i} className="text-black/80">• {s}</li>)}</ul>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-red-700">What doesn't</h3>
          <ul className="text-sm space-y-1">{review.whatDoesnt.map((s: string, i: number) => <li key={i} className="text-black/80">• {s}</li>)}</ul>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">10-min fixes</h3>
          <ol className="text-sm space-y-1.5">{review.specificFixes.map((s: string, i: number) => <li key={i} className="text-black/80">{i + 1}. {s}</li>)}</ol>
        </div>
        <details className="mb-4">
          <summary className="text-xs text-black/60 cursor-pointer">Full feedback</summary>
          <p className="text-sm mt-2 whitespace-pre-wrap text-black/70">{review.rawFeedback}</p>
        </details>
        <button onClick={() => onApprove(asset.id)} className="bg-[#013b4a] text-[#fffff4] px-4 py-2 rounded-md text-sm font-medium w-full">
          Approve for post
        </button>
      </div>
    </div>
  );
}
