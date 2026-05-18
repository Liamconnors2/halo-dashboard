const IG_API = 'https://graph.facebook.com/v19.0'

export type IgMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL'

export interface IgPost {
  id: string
  caption?: string
  media_type: IgMediaType
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
}

export interface IgInsights {
  views?: number
  reach?: number
  likes?: number
  comments?: number
  shares?: number
  saved?: number
  follows?: number
  total_interactions?: number
  ig_reels_avg_watch_time?: number  // milliseconds
  reels_skip_rate?: number          // percentage 0–100
}

async function get(path: string, params: Record<string, string> = {}) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!
  const url = new URL(`${IG_API}${path}`)
  url.searchParams.set('access_token', token)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Meta API error: ${await res.text()}`)
  return res.json()
}

export async function fetchRecentPosts(limit = 50): Promise<IgPost[]> {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID!
  const data = await get(`/${accountId}/media`, {
    fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
    limit: String(limit),
  })
  return data.data ?? []
}

export async function fetchPostInsights(postId: string, mediaType: IgMediaType): Promise<IgInsights> {
  const isVideo = mediaType === 'REEL' || mediaType === 'VIDEO'

  // follows is NOT supported for VIDEO/REEL — must be requested separately for images only
  // views, reels_skip_rate, ig_reels_avg_watch_time are ONLY for VIDEO/REEL
  const videoMetrics = 'views,reach,likes,comments,shares,saved,ig_reels_avg_watch_time,reels_skip_rate'
  const imageMetrics = 'reach,likes,comments,shares,saved,follows,total_interactions'

  try {
    const data = await get(`/${postId}/insights`, {
      metric: isVideo ? videoMetrics : imageMetrics,
    })
    const result: IgInsights = {}
    for (const item of data.data ?? []) {
      result[item.name as keyof IgInsights] = item.values?.[0]?.value ?? item.value ?? 0
    }
    return result
  } catch {
    return {}
  }
}

export async function refreshToken(): Promise<{ token: string; expiresIn: number }> {
  const url = new URL(`${IG_API}/oauth/access_token`)
  url.searchParams.set('grant_type', 'ig_refresh_token')
  url.searchParams.set('access_token', process.env.INSTAGRAM_ACCESS_TOKEN!)
  const res = await fetch(url.toString())
  const data = await res.json()
  return { token: data.access_token, expiresIn: data.expires_in }
}
