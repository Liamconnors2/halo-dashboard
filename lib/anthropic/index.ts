import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-opus-4-7';

const SYSTEM_PROMPT = `You are the senior content strategist for Halo, an Australian premium sauna accessories brand.

Halo's framework has six content pillars derived from analysis of 223 real customer reviews:

1. Time extension proof (21.5% of reviews) — visual proof customers stay in longer. Customer language: "10 to 25 mins", "doubled my time", "spit fire".
2. Hair protection (18.8%) — stop choosing between sauna and hair. Stylist POV, colour-treated audiences.
3. Embarrassed to proud — the silent objection. "Sauna hats look stupid" → confront it.
4. Founder POV — Liam (founder, also works at Red Bull) on camera. "Builder Behind the Brand".
5. Ritual & world — aesthetic, Ricoh GR III Negative Film recipe, cinematic.
6. Education & authority — sauna science, first-timer guides, save-worthy.

Brand voice: bold, data-driven, iterative. Tagline: "Go longer · Recover stronger · Train harder." Tone is confident without being cocky. Specific over vague. Real over polished.

Visual identity: cream #fffff4, deep teal #013b4a, black #010101. Botanical Collection adds antique white + green olive or copper coin.

Your job: review draft content (script, image, or video brief) and give specific, actionable feedback. Score 1-10 across these dimensions:
- Hook strength (0-3 sec attention grab)
- Pillar alignment (does it deliver on the stated intent?)
- Customer language match (does it sound like a real Halo customer, or like AI copy?)
- Brand consistency (visual, tone, value match?)
- Conversion potential (does it move someone toward purchase or follow?)

Be honest. If something is weak, say so and propose the specific fix. Never give vague praise. Always end with 2-3 concrete changes the user can make in 10 minutes.`;

export interface ContentReviewInput {
  pillarId: number;
  pillarName: string;
  pillarIntent: string;
  contentType: 'reel' | 'carousel' | 'story' | 'image' | 'script';
  description: string;
  scriptText?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface ContentReviewResult {
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
}

export async function analyzeContent(input: ContentReviewInput): Promise<ContentReviewResult> {
  const userMessage: Anthropic.MessageParam = {
    role: 'user',
    content: []
  };

  const content = userMessage.content as Anthropic.ContentBlockParam[];

  if (input.imageBase64 && input.imageMimeType) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: input.imageMimeType as any, data: input.imageBase64 }
    });
  }

  content.push({
    type: 'text',
    text: `Review this ${input.contentType} draft.

Target pillar: ${input.pillarName} (#${input.pillarId})
Pillar intent: ${input.pillarIntent}

Description: ${input.description}

${input.scriptText ? `Script / caption:\n${input.scriptText}` : ''}

Respond ONLY in valid JSON, no preamble, with this exact shape:
{
  "scoreOverall": number 1-10,
  "scoreHook": number 1-10,
  "scorePillar": number 1-10,
  "scoreCustomerVoice": number 1-10,
  "scoreBrand": number 1-10,
  "scoreConversion": number 1-10,
  "whatWorks": [string, string, string],
  "whatDoesnt": [string, string, string],
  "specificFixes": [string, string, string],
  "rawFeedback": "string — 2-3 paragraph honest critique"
}`
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [userMessage]
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as ContentReviewResult;
}

export async function classifyPostToPillar(caption: string): Promise<number | null> {
  if (!caption?.trim()) return null
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 10,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Classify this Instagram post caption into exactly one of Halo's 6 content pillars.

Caption: "${caption.slice(0, 500)}"

Reply with ONLY a single digit: 1, 2, 3, 4, 5, or 6. Nothing else.`
    }]
  })
  const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('').trim()
  const n = parseInt(text)
  return n >= 1 && n <= 6 ? n : null
}

export interface PillarStat {
  pillarId: number
  pillarName: string
  postCount: number
  avgReach: number
  avgLikes: number
  avgSaves: number
  avgShares: number
  avgWatchTime: number | null
  avgSkipRate: number | null
  topPost: { caption: string; reach: number; saves: number }
}

export interface PerformanceInsights {
  topPillar: string
  weakestPillar: string
  bestFormat: string
  hookPatterns: string[]
  doMoreOf: string[]
  stopDoing: string[]
  nextWeekFocus: string[]
  newConcepts: { pillar: string; concept: string; rationale: string }[]
  summary: string
}

export async function generatePerformanceInsights(stats: PillarStat[], totalPosts: number): Promise<PerformanceInsights> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Analyse this Instagram performance data for @thehalo.au and generate strategic recommendations.

PERFORMANCE DATA (${totalPosts} posts total):
${JSON.stringify(stats, null, 2)}

Based on this data, return ONLY valid JSON with this exact shape:
{
  "topPillar": "name of highest-reach pillar",
  "weakestPillar": "name of lowest-reach pillar",
  "bestFormat": "e.g. short-form reel, carousel, etc. based on watch time + reach patterns",
  "hookPatterns": ["pattern observed in top posts", "pattern 2", "pattern 3"],
  "doMoreOf": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"],
  "stopDoing": ["what is underperforming and why", "item 2"],
  "nextWeekFocus": ["concrete task for next week", "task 2", "task 3", "task 4"],
  "newConcepts": [
    { "pillar": "pillar name", "concept": "new content concept", "rationale": "why this will work based on the data" },
    { "pillar": "pillar name", "concept": "new content concept", "rationale": "why" },
    { "pillar": "pillar name", "concept": "new content concept", "rationale": "why" }
  ],
  "summary": "2-sentence plain English summary of what the data is telling you"
}`
    }]
  })

  const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('')
  return JSON.parse(text.replace(/```json|```/g, '').trim()) as PerformanceInsights
}

export interface IdeaEnrichment {
  title: string;
  pillarId: number;
  contentType: 'reel' | 'carousel' | 'story' | 'ad' | 'hook';
  priority: number;
  hook: string;
  hookVariants: string[];
  framework: string;
  shootChecklist: string[];
  caption: string;
  tags: string[];
  reasoning: string;
}

export async function enrichIdea(rawDump: string): Promise<IdeaEnrichment> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Develop this raw content idea into a full production brief for @thehalo.au.

RAW IDEA:
"${rawDump}"

Classify it, sharpen it, and make it executable. Return ONLY valid JSON with this exact shape:
{
  "title": "5-7 word descriptive title for the content piece",
  "pillarId": 1,
  "contentType": "reel",
  "priority": 8,
  "hook": "The single strongest hook variant — under 12 words, stops the scroll cold",
  "hookVariants": [
    "Hook variant A (problem-led)",
    "Hook variant B (curiosity/question)",
    "Hook variant C (stat or number)"
  ],
  "framework": "Full 200-300 word production brief. Cover: what to film or design, key angles, pacing, core message arc, why this will resonate with Halo's audience. Write as a director's brief — specific and actionable.",
  "shootChecklist": [
    "Prep item 1",
    "Prep item 2",
    "Prep item 3",
    "Prep item 4"
  ],
  "caption": "Full Instagram caption. Lead with the hook. Middle: one specific customer proof point or stat. End with CTA. Max 150 words.",
  "tags": ["tag1", "tag2", "tag3"],
  "reasoning": "2 sentences: why this idea fits Halo right now, and what makes it worth executing over other ideas in the vault."
}

Priority guide: 9-10 = top pillar gap + emotional hook + customer proof. 7-8 = strong idea, clear execution. 5-6 = solid but not urgent. Below 5 = park it.`
    }]
  });

  const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('');
  return JSON.parse(text.replace(/```json|```/g, '').trim()) as IdeaEnrichment;
}

export interface WeekPlanRecommendation {
  recipeIds: string[];
  reasoning: Record<string, string>;
  weekTheme: string;
  priorityPillar: number;
}

export async function planNextWeek(
  pillarStats: PillarStat[],
  recentRecipeIds: string[],
  availableRecipes: Array<{ id: string; name: string; pillarId: number }>
): Promise<WeekPlanRecommendation> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Plan next week's content shoots for @thehalo.au.

RECENT PERFORMANCE BY PILLAR:
${JSON.stringify(pillarStats, null, 2)}

RECIPES USED IN RECENT WEEKS (avoid repeating same two back-to-back):
${recentRecipeIds.join(', ')}

AVAILABLE RECIPES:
${availableRecipes.map(r => `- ${r.id} (pillar ${r.pillarId}): ${r.name}`).join('\n')}

Choose 3-5 recipes for next week that:
1. Prioritise the highest-performing pillars (more reach/saves = double down)
2. Don't neglect pillars that haven't been covered recently
3. Avoid repeating the same recipe that was used last week
4. Always include one keystone shoot (thermal-demo or customer-interview or aesthetic-broll)
5. Always include founder-reactions if it hasn't been used in 2+ weeks

Return ONLY valid JSON:
{
  "recipeIds": ["recipe-id-1", "recipe-id-2", ...],
  "reasoning": { "recipe-id-1": "one sentence why", "recipe-id-2": "why" },
  "weekTheme": "one-line theme for the week e.g. 'Double down on time extension proof'",
  "priorityPillar": 1
}`
    }]
  });

  const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('');
  return JSON.parse(text.replace(/```json|```/g, '').trim()) as WeekPlanRecommendation;
}

export async function generateHookVariations(reviewText: string, pillarName: string, pillarIntent: string): Promise<string[]> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `A customer wrote this review:

"${reviewText}"

Generate 5 viral-style hook variations (first 3-5 seconds of a reel) for the "${pillarName}" pillar (${pillarIntent}). Each hook must be under 12 words, written in the customer's own voice not yours, and pattern-interrupt enough to stop a scroll.

Return ONLY a JSON array of 5 strings. No preamble.`
    }]
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  return JSON.parse(text.replace(/```json|```/g, '').trim());
}
