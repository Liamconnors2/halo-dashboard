import { PrismaClient, TaskType } from '@prisma/client';
import { startOfWeek, addDays } from 'date-fns';
import { generateWeek } from '../lib/week-generator';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

const PILLARS = [
  {
    id: 1,
    name: 'Time extension proof',
    description: 'The #1 angle from reviews (21.5%). Prove visually how much longer customers stay.',
    colorHex: '#FAEEDA',
    textHex: '#854F0B',
    intent: 'Make the time-extension benefit undeniable. Specific numbers, real customers, visual demonstration. Customer language: "10 to 25 mins", "doubled my time", "head started cooking", "spit fire".'
  },
  {
    id: 2,
    name: 'Hair protection',
    description: 'Almost a second product (18.8% of reviews). Colour-treated, curls, blonde audiences.',
    colorHex: '#FBEAF0',
    textHex: '#72243E',
    intent: 'Stop forcing customers to choose between sauna and hair. Stylist POV, before/after, colour-treated specifically. Customer language: "saved my hair", "no more split ends", "my colourist asked what I changed".'
  },
  {
    id: 3,
    name: 'Embarrassed to proud',
    description: 'The silent objection blocking purchase. Confront looks-shame head-on.',
    colorHex: '#FAECE7',
    textHex: '#712B13',
    intent: 'Disarm the "sauna hats look stupid" objection. Side-by-side bad hats vs Halo, double-takes, people-ask-where-I-got-it stories. Customer language: "gnome hat", "viking hat", "embarrassed at first now wear with pride".'
  },
  {
    id: 4,
    name: 'Founder POV',
    description: 'Liam on camera. The Builder Behind the Brand.',
    colorHex: '#EEEDFE',
    textHex: '#3C3489',
    intent: 'Build personal brand equity. Founder reactions to reviews, why-I-started, behind-the-build content. Halo as the brand that talks to its customers.'
  },
  {
    id: 5,
    name: 'Ritual & world',
    description: 'The aesthetic. Negative Film recipe. Moments only Halo can do.',
    colorHex: '#E1F5EE',
    textHex: '#085041',
    intent: 'Build the world. Slow cinematic content. No hard sell. Make people want to be inside the brand. Ricoh GR III, Negative Film, deep teal, cream, black.'
  },
  {
    id: 6,
    name: 'Education & authority',
    description: 'Earn the follow. Sauna science, breathwork, first-timer guides.',
    colorHex: '#E6F1FB',
    textHex: '#0C447C',
    intent: 'Become the authority on getting-more-from-sauna. Save-worthy content. Halo positioned as the enabler of better sauna practice, not just merch.'
  }
];


function classifyReview(text: string): { themes: string[], pillarId: number | null, contentPotential: number } {
  const lower = text.toLowerCase();
  const themes: string[] = [];
  let pillarId: number | null = null;
  let contentPotential = 1;

  const timeWords = /\b(longer|extend|stay in|push through|last longer|more time|double|twice as long|elongate|outlast|min)\b/;
  const hairWords = /\b(hair|scalp|curls|colou?r.treated|dye|blonde|frizz|split ends|stylist|colourist)\b/;
  const looksWords = /\b(look|style|stylish|embarrass|silly|gnome|viking|design|aesthetic|fashion)\b/;
  const recoveryWords = /\b(recovery|recover|training|workout|gym|athlet|muscle|soreness)\b/;
  const wellnessWords = /\b(sleep|skin|inflammation|immune|stress|mood|breath|meditat)\b/;
  const giftWords = /\b(gift|bought for|husband|wife|daughter|son|mom|mum|dad)\b/;
  const beforeAfter = /\b(used to|before|now|since|gone from|from \d)\b/;

  if (timeWords.test(lower)) { themes.push('duration'); pillarId = 1; contentPotential += 2; }
  if (hairWords.test(lower)) { themes.push('hair'); if (!pillarId) pillarId = 2; contentPotential += 2; }
  if (looksWords.test(lower)) { themes.push('looks'); if (!pillarId) pillarId = 3; contentPotential += 1; }
  if (recoveryWords.test(lower)) { themes.push('recovery'); contentPotential += 1; }
  if (wellnessWords.test(lower)) { themes.push('wellness'); contentPotential += 1; }
  if (giftWords.test(lower)) { themes.push('gift'); contentPotential += 1; }
  if (beforeAfter.test(lower)) { themes.push('before_after'); contentPotential += 2; }
  if (/\b(spit fire|game changer|life.changing|incredible|amazing|life saver)\b/.test(lower)) {
    themes.push('high_emotion');
    contentPotential += 3;
  }
  if (/\b\d+\s*(min|minute)/.test(lower) && /\b(now|to|from)\b/.test(lower)) {
    themes.push('specific_numbers');
    contentPotential += 2;
  }

  return { themes, pillarId, contentPotential: Math.min(contentPotential, 10) };
}

async function main() {
  console.log('Seeding pillars...');
  for (const p of PILLARS) {
    await prisma.pillar.upsert({
      where: { id: p.id },
      update: p,
      create: p
    });
  }

  console.log('Seeding default week...');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const week = await prisma.week.upsert({
    where: { weekStart },
    update: {},
    create: { weekStart, status: 'active' }
  });

  await prisma.task.deleteMany({ where: { weekId: week.id } });

  const generatedTasks = generateWeek();

  for (const t of generatedTasks) {
    await prisma.task.create({
      data: {
        weekId: week.id,
        dayOfWeek: t.dayOfWeek,
        type: t.type,
        pillarId: t.pillarId,
        title: t.title,
        detail: t.detail,
        brief: t.brief,
        order: t.order
      }
    });
  }

  const csvPath = path.join(process.cwd(), 'data', 'reviews_export.csv');
  if (fs.existsSync(csvPath)) {
    console.log('Seeding reviews from CSV...');
    const csv = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csv, { columns: true, skip_empty_lines: true, bom: true });
    let imported = 0;
    for (const r of records) {
      if (!r.review || !r.review.trim()) continue;
      const { themes, pillarId, contentPotential } = classifyReview(r.review);
      try {
        await prisma.review.upsert({
          where: { id: r.id },
          update: { themes, pillarId, contentPotential },
          create: {
            id: r.id,
            rating: parseInt(r.rating),
            email: r.email || null,
            nickname: r.nickname || null,
            fullName: r.full_name || null,
            reviewText: r.review,
            reviewDate: new Date(r.date),
            imageUrl: r.img || null,
            verifiedPurchase: r.verified_purchase === 'true',
            duration: r['What is your new per-session duration?'] || null,
            themes,
            pillarId,
            contentPotential
          }
        });
        imported++;
      } catch (e) {
        console.error(`Failed to import review ${r.id}:`, e);
      }
    }
    console.log(`Imported ${imported} reviews`);
  } else {
    console.log('No reviews CSV found at data/reviews_export.csv — skipping');
  }

  console.log('Seeding starter hook bank...');
  const topReviews = await prisma.review.findMany({
    where: { contentPotential: { gte: 6 } },
    orderBy: { contentPotential: 'desc' },
    take: 30
  });

  await prisma.hook.deleteMany({});
  for (const r of topReviews) {
    if (!r.pillarId) continue;
    const sentences = r.reviewText.split(/[.!?]+/).filter(s => s.trim().length > 15 && s.trim().length < 150);
    for (const s of sentences.slice(0, 2)) {
      await prisma.hook.create({
        data: {
          text: s.trim(),
          source: r.nickname || r.fullName || 'Anonymous',
          reviewId: r.id,
          pillarId: r.pillarId,
          tags: r.themes
        }
      });
    }
  }

  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
