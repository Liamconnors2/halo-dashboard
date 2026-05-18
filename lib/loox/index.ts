// Loox doesn't currently expose a fully documented public REST API for reviews.
// The most reliable approach is:
//   1. Use Loox admin export → CSV → upload manually OR via the sync route's CSV endpoint
//   2. If you have a Loox API key with reviews:read scope, hit their endpoint directly
//
// This client supports both. The fallback is reading a CSV from a public URL you set
// (e.g. a Loox-exported CSV uploaded to R2 weekly), which is more reliable than scraping.

interface LooxReview {
  id: string;
  rating: number;
  email?: string;
  nickname?: string;
  fullName?: string;
  reviewText: string;
  reviewDate: string;
  imageUrl?: string;
  verifiedPurchase: boolean;
  duration?: string;
}

const LOOX_API_BASE = 'https://api.loox.io/v1';

export async function fetchLooxReviewsViaAPI(): Promise<LooxReview[]> {
  const apiKey = process.env.LOOX_API_KEY;
  const shop = process.env.LOOX_SHOP_DOMAIN;
  if (!apiKey) throw new Error('LOOX_API_KEY not set');

  const response = await fetch(`${LOOX_API_BASE}/reviews?shop=${shop}&limit=500`, {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Loox API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return (data.reviews || []).map((r: any): LooxReview => ({
    id: r.id,
    rating: r.rating,
    email: r.email,
    nickname: r.nickname || r.author?.name,
    fullName: r.full_name || r.author?.full_name,
    reviewText: r.text || r.review || '',
    reviewDate: r.created_at || r.date,
    imageUrl: r.image_url || r.media?.[0]?.url,
    verifiedPurchase: r.verified_purchase || false,
    duration: r.metadata?.['What is your new per-session duration?']
  }));
}

export async function fetchLooxReviewsViaCSV(csvUrl: string): Promise<LooxReview[]> {
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Could not fetch CSV: ${response.status}`);
  const text = await response.text();
  return parseLooxCSV(text);
}

export function parseLooxCSV(csv: string): LooxReview[] {
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const stripBOM = (s: string) => s.replace(/^\uFEFF/, '');
  const headers = parseCSVLine(stripBOM(lines[0]));

  return lines.slice(1).map(line => {
    const cells = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] || ''; });
    return {
      id: row.id,
      rating: parseInt(row.rating) || 5,
      email: row.email || undefined,
      nickname: row.nickname || undefined,
      fullName: row.full_name || undefined,
      reviewText: row.review || '',
      reviewDate: row.date || new Date().toISOString(),
      imageUrl: row.img || undefined,
      verifiedPurchase: row.verified_purchase === 'true',
      duration: row['What is your new per-session duration?'] || undefined
    };
  }).filter(r => r.id && r.reviewText.trim());
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else current += ch;
  }
  result.push(current);
  return result;
}
