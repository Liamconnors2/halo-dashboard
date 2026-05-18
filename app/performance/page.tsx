'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PerformanceInsights } from '@/lib/anthropic'

const PILLAR_COLORS: Record<number, string> = {
  1: '#013b4a', 2: '#2d6a4f', 3: '#9c4221', 4: '#7c3aed', 5: '#b45309', 6: '#1d4ed8',
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function er(p: { likes: number | null; comments: number | null; shares: number | null; saves: number | null }, reach: number | null) {
  if (!reach || reach === 0) return null
  const eng = (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.saves ?? 0)
  return ((eng / reach) * 100).toFixed(1)
}

interface Asset {
  id: string
  notes: string | null
  thumbnailUrl: string | null
  postedAt: string | null
  pillar: { id: number; name: string } | null
  performance: {
    views: number | null
    reach: number | null
    likes: number | null
    comments: number | null
    shares: number | null
    saves: number | null
    follows: number | null
    watchTimeAvg: number | null
    skipRate: number | null
  } | null
}

export default function PerformancePage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<PerformanceInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState('')

  useEffect(() => {
    fetch('/api/performance')
      .then(r => r.json())
      .then(d => { setAssets(d.assets ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function loadInsights() {
    setInsightsLoading(true)
    setInsightsError('')
    try {
      const r = await fetch('/api/performance/insights')
      const d = await r.json()
      if (d.error) setInsightsError(d.error)
      else setInsights(d.insights)
    } catch (e: any) {
      setInsightsError(e.message)
    }
    setInsightsLoading(false)
  }

  const totalReach = assets.reduce((s, a) => s + (a.performance?.reach ?? 0), 0)
  const totalSaves = assets.reduce((s, a) => s + (a.performance?.saves ?? 0), 0)
  const totalFollows = assets.reduce((s, a) => s + (a.performance?.follows ?? 0), 0)
  const totalShares = assets.reduce((s, a) => s + (a.performance?.shares ?? 0), 0)

  // Pillar rollup
  const pillarMap: Record<number, { name: string; reach: number; saves: number; count: number }> = {}
  for (const a of assets) {
    if (!a.pillar || !a.performance) continue
    const s = pillarMap[a.pillar.id] ?? { name: a.pillar.name, reach: 0, saves: 0, count: 0 }
    s.reach += a.performance.reach ?? 0
    s.saves += a.performance.saves ?? 0
    s.count++
    pillarMap[a.pillar.id] = s
  }
  const pillarList = Object.entries(pillarMap).sort((a, b) => b[1].reach - a[1].reach)
  const maxReach = pillarList[0]?.[1].reach ?? 1

  if (loading) return <div className="text-sm text-black/40 mt-8 text-center">Loading…</div>

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Performance</h1>
          <p className="text-sm text-black/50 mt-0.5">{assets.length} posts from @thehalo.au</p>
        </div>
        <Link href="/settings" className="text-sm border border-black/15 px-3 py-1.5 rounded-md hover:bg-black/5">
          Sync data →
        </Link>
      </header>

      {assets.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-xl p-10 text-center">
          <p className="text-black/40 text-sm mb-3">No Instagram data yet.</p>
          <Link href="/settings" className="bg-[#013b4a] text-[#fffff4] px-4 py-2 rounded-md text-sm font-medium">
            Sync Instagram metrics
          </Link>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total reach', value: fmt(totalReach) },
              { label: 'Total saves', value: fmt(totalSaves) },
              { label: 'Total shares', value: fmt(totalShares) },
              { label: 'New follows', value: fmt(totalFollows) },
            ].map(c => (
              <div key={c.label} className="bg-white border border-black/10 rounded-xl p-4">
                <p className="text-xs text-black/40 mb-1">{c.label}</p>
                <p className="text-xl font-semibold tracking-tight">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Pillar breakdown */}
          {pillarList.length > 0 && (
            <section className="bg-white border border-black/10 rounded-xl p-5 mb-4">
              <h2 className="text-sm font-medium mb-4">Reach by pillar</h2>
              <div className="space-y-3">
                {pillarList.map(([id, s]) => (
                  <div key={id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{s.name}</span>
                      <span className="text-black/40">{fmt(s.reach)} reach · {fmt(s.saves)} saves · {s.count} posts</span>
                    </div>
                    <div className="h-1.5 bg-black/5 rounded-full">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${(s.reach / maxReach) * 100}%`, backgroundColor: PILLAR_COLORS[Number(id)] ?? '#013b4a' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AI Recommendations */}
          <section className="bg-white border border-black/10 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-medium">AI recommendations</h2>
                <p className="text-xs text-black/40 mt-0.5">Claude analyses your performance data and tells you what to do next week</p>
              </div>
              <button
                onClick={loadInsights}
                disabled={insightsLoading}
                className="bg-[#013b4a] text-[#fffff4] px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 shrink-0"
              >
                {insightsLoading ? 'Analysing…' : insights ? 'Refresh' : 'Generate insights'}
              </button>
            </div>

            {insightsError && <p className="text-xs text-red-500 mb-3">{insightsError}</p>}

            {insights && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/[0.03] rounded-lg p-3">
                    <p className="text-[10px] text-black/40 uppercase tracking-wide mb-1">Top pillar</p>
                    <p className="text-sm font-medium">{insights.topPillar}</p>
                  </div>
                  <div className="bg-black/[0.03] rounded-lg p-3">
                    <p className="text-[10px] text-black/40 uppercase tracking-wide mb-1">Best format</p>
                    <p className="text-sm font-medium">{insights.bestFormat}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-black/40 mb-2">Summary</p>
                  <p className="text-sm leading-relaxed">{insights.summary}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-2">✓ Do more of</p>
                    <ul className="space-y-1">
                      {insights.doMoreOf.map((item, i) => (
                        <li key={i} className="text-xs text-black/70 flex gap-2"><span className="text-black/20">—</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-2">✗ Stop / change</p>
                    <ul className="space-y-1">
                      {insights.stopDoing.map((item, i) => (
                        <li key={i} className="text-xs text-black/70 flex gap-2"><span className="text-black/20">—</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2">Hook patterns that work</p>
                  <div className="flex flex-wrap gap-2">
                    {insights.hookPatterns.map((h, i) => (
                      <span key={i} className="bg-[#013b4a]/10 text-[#013b4a] text-xs px-2 py-1 rounded-full">{h}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2">Next week focus</p>
                  <ol className="space-y-1">
                    {insights.nextWeekFocus.map((item, i) => (
                      <li key={i} className="text-xs text-black/70 flex gap-2"><span className="text-black/30 font-medium">{i + 1}.</span>{item}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2">New concepts to test</p>
                  <div className="space-y-2">
                    {insights.newConcepts.map((c, i) => (
                      <div key={i} className="border border-black/8 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-wide text-black/40">{c.pillar}</span>
                        </div>
                        <p className="text-sm font-medium">{c.concept}</p>
                        <p className="text-xs text-black/50 mt-0.5">{c.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Post table */}
          <section className="bg-white border border-black/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-black/5">
              <h2 className="text-sm font-medium">All posts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-black/40">Post</th>
                    <th className="px-3 py-3 text-xs font-medium text-black/40 text-right">Views</th>
                    <th className="px-3 py-3 text-xs font-medium text-black/40 text-right">Reach</th>
                    <th className="px-3 py-3 text-xs font-medium text-black/40 text-right">Saves</th>
                    <th className="px-3 py-3 text-xs font-medium text-black/40 text-right">Shares</th>
                    <th className="px-3 py-3 text-xs font-medium text-black/40 text-right">Follows</th>
                    <th className="px-3 py-3 text-xs font-medium text-black/40 text-right">Eng%</th>
                    <th className="px-3 py-3 text-xs font-medium text-black/40 text-right hidden lg:table-cell">Watch</th>
                    <th className="px-3 py-3 text-xs font-medium text-black/40 text-right hidden lg:table-cell">Skip%</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => {
                    const p = a.performance
                    const caption = a.notes?.slice(0, 55) ?? ''
                    const date = a.postedAt ? new Date(a.postedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : ''
                    return (
                      <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {a.thumbnailUrl && (
                              <img src={a.thumbnailUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xs">{caption || '(no caption)'}</p>
                              <p className="text-[11px] text-black/30 mt-0.5">
                                {date}
                                {a.pillar && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${PILLAR_COLORS[a.pillar.id]}18`, color: PILLAR_COLORS[a.pillar.id] }}>
                                    {a.pillar.name}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{fmt(p?.views)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{fmt(p?.reach)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{fmt(p?.saves)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{fmt(p?.shares)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{fmt(p?.follows)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{p ? er(p, p.reach) ? `${er(p, p.reach)}%` : '—' : '—'}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs hidden lg:table-cell">{p?.watchTimeAvg ? `${p.watchTimeAvg.toFixed(1)}s` : '—'}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs hidden lg:table-cell">{p?.skipRate != null ? `${p.skipRate.toFixed(1)}%` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
