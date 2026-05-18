import { TaskType } from '@prisma/client';

export type RecipeTask = {
  type: TaskType;
  pillarId: number | null;
  title: string;
  detail: string;
  brief: string;
};

export type ContentRecipe = {
  id: string;
  name: string;
  pillarId: number;
  shoot: RecipeTask & { dayOfWeek: number };
  prep?: Array<RecipeTask & { daysBeforeShoot: number }>;
  edit: RecipeTask & { daysAfterShoot: number };
  post: RecipeTask & { daysAfterShoot: number };
};

export type GeneratedTask = {
  dayOfWeek: number;
  type: TaskType;
  pillarId: number | null;
  title: string;
  detail: string;
  brief: string;
  order: number;
  recipeId?: string;
};

// dayOfWeek: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun

export const CONTENT_RECIPES: ContentRecipe[] = [
  {
    id: 'thermal-demo',
    name: 'Thermal camera demo',
    pillarId: 1,
    shoot: {
      dayOfWeek: 5,
      type: 'film',
      pillarId: 1,
      title: 'KEYSTONE: Thermal camera demo shoot',
      detail: 'The week\'s anchor visual. 90 sec of raw thermal footage.',
      brief: 'Shot list:\n1. Wide shot, sauna entry, thermal cam visible\n2. Close-up forehead temp readout (no hat)\n3. Same shot wearing Halo\n4. Side-by-side overlay shot for edit\n5. Reaction shot leaving sauna\n\nGear: Thermal cam, GoPro, towel, water. Wear hero colourway.\n\nHook to film: "Your head cooks first. Here\'s the proof."'
    },
    prep: [
      {
        daysBeforeShoot: 1,
        type: 'prep',
        pillarId: 1,
        title: 'Confirm sauna access for tomorrow\'s thermal shoot',
        detail: 'Book time slot, confirm thermal cam batteries charged.',
        brief: 'Checklist:\n□ Sauna location booked (which one?)\n□ Thermal camera charged\n□ Microfibre towels packed\n□ Hero colourway Halo packed\n□ GoPro charged + SD card free space\n\nIf sauna access falls through: pivot to home sauna or push shoot one week.'
      }
    ],
    edit: {
      daysAfterShoot: 2,
      type: 'edit',
      pillarId: 1,
      title: 'Edit Saturday\'s thermal camera reel',
      detail: 'Cut to 22-28 sec reel. Two hook variants.',
      brief: 'Hook A: "This is why you leave the sauna at 15 minutes."\nHook B: "Watch what happens to your head in 90 seconds."\n\nCaption: Open with science one-liner. Middle: 2 customer quotes with names. End: "Halo. Stay in longer." Link in bio.\n\nExport both hook variants. Pick the strongest before posting.'
    },
    post: {
      daysAfterShoot: 3,
      type: 'post',
      pillarId: 1,
      title: 'Reel: thermal camera proof',
      detail: 'Tuesday 7-9pm post window for max IG reach.',
      brief: 'Source: Saturday\'s shoot.\n\nPosting window: 7-9pm local time.\n\nCaption: Lead with science one-liner. Drop 2 customer quotes with @ tags if public. CTA: "Stay in longer. Link in bio."\n\nFirst-comment trick: drop trending hook in comment 1 to boost algorithm.'
    }
  },
  {
    id: 'customer-interview',
    name: 'Customer phone call recording',
    pillarId: 1,
    shoot: {
      dayOfWeek: 5,
      type: 'film',
      pillarId: 1,
      title: 'KEYSTONE: Customer interview / phone call',
      detail: '20min call with a customer. Record audio for B-roll use.',
      brief: 'Target customers: Nolan H. (12→20+ min), Phillip Berry (10→25), Daniel M. (bald, 15→20).\n\nQuestions:\n1. What was your sauna like before Halo?\n2. What made you finally try a sauna hat?\n3. First session — what changed?\n4. What do you tell friends?\n5. One word for sauna now?\n\nUse audio over sauna B-roll for next week\'s reel.'
    },
    prep: [
      {
        daysBeforeShoot: 4,
        type: 'engage',
        pillarId: null,
        title: 'DM customer to book Saturday phone call',
        detail: 'Lock the interview slot 4 days out.',
        brief: 'Template DM:\n"Hey [name], loved your review — would you be open to a 20 min phone call Saturday? I want to share your story (with your permission) as part of our customer feature series. Happy to send you a free sauna mat as thanks."\n\nBackup customers if first declines: have 2 more ready.'
      }
    ],
    edit: {
      daysAfterShoot: 7,
      type: 'edit',
      pillarId: 1,
      title: 'Edit customer interview reel',
      detail: 'Audio over B-roll. 30-45 sec final.',
      brief: 'Use the strongest 20 sec from the interview as voiceover.\n\nLayer over: sauna B-roll from this weekend\'s shoot + product shots.\n\nOn-screen text: customer name, their before/after time jump.'
    },
    post: {
      daysAfterShoot: 9,
      type: 'post',
      pillarId: 1,
      title: 'Reel: real customer story',
      detail: 'Long-form social proof. Tag the customer.',
      brief: 'Caption: Open with the customer\'s one-word answer for sauna now. Middle: their before/after minutes. End: thank them publicly.'
    }
  },
  {
    id: 'aesthetic-broll',
    name: 'Aesthetic B-roll',
    pillarId: 5,
    shoot: {
      dayOfWeek: 5,
      type: 'film',
      pillarId: 5,
      title: 'KEYSTONE: Aesthetic B-roll shoot',
      detail: 'Ricoh GR III on Negative Film recipe. Build visual bank.',
      brief: 'Shot list:\n1. Hat on hook against deep teal wall\n2. Hands placing folded hat in bag\n3. Hat + mat together, overhead\n4. Slow pan across stitching detail\n5. Hat steaming off after sauna\n6. Founder hand reaching for hat from gym bag\n7. Sauna door opening (POV)\n8. Hat in front of cold plunge\n\nOutput: 12-15 stills + 6-8 short clips.'
    },
    edit: {
      daysAfterShoot: 5,
      type: 'edit',
      pillarId: 5,
      title: 'Edit aesthetic ritual reel',
      detail: 'Slow, voiceover-led, cinematic. From Sat B-roll.',
      brief: 'Voiceover: "The future doesn\'t wait for those who leave early. So we built something that helps you stay."\n\nVisual sequence: Wake → kettle → hat from hook → walk → sauna door → hat on → settle in → exhale.\n\nMusic: ambient. No trending audio.'
    },
    post: {
      daysAfterShoot: 6,
      type: 'post',
      pillarId: 5,
      title: 'Aesthetic reel: morning sauna ritual',
      detail: 'Friday post. Brand-building, not algorithm-chasing.',
      brief: 'Caption: Lead with the tagline. Middle: one paragraph on the ritual. No CTA.\n\nWhy Friday: weekend mindset, audience receptive to brand stories vs hard-sell.'
    }
  },
  {
    id: 'founder-reactions',
    name: 'Founder reaction to reviews',
    pillarId: 4,
    shoot: {
      dayOfWeek: 6,
      type: 'film',
      pillarId: 4,
      title: 'KEYSTONE: Founder reaction shoot (3 reviews)',
      detail: 'Read 3 real customer reviews on camera. Real emotion.',
      brief: 'Reviews to react to:\n• Thomas H. — "felt like I could spit fire"\n• Caroline Y. — PTSD management\n• Keira F. — stylist recommendation\n\nScript frame: Phone in hand, scroll, react, repeat. Vertical 9:16. Real emotion, no script.\n\nOutput: 3 reels for Tue/Wed/Thu next week.'
    },
    prep: [
      {
        daysBeforeShoot: 1,
        type: 'prep',
        pillarId: 4,
        title: 'Screenshot 3 reviews + setup phone for tomorrow\'s reaction shoot',
        detail: 'Prep the review screenshots, charge phone, plan kitchen light.',
        brief: 'Pre-shoot:\n□ Screenshot the 3 chosen reviews (Thomas H., Caroline Y., Keira F.)\n□ Save to phone in dedicated album\n□ Phone fully charged\n□ Test natural light position in kitchen (mid-morning best)\n□ Hero colourway hat at hand for B-roll'
      }
    ],
    edit: {
      daysAfterShoot: 2,
      type: 'edit',
      pillarId: 4,
      title: 'Edit Sunday\'s founder reactions',
      detail: 'Cut to 3 separate reels.',
      brief: 'Edit notes per reel:\n• Hook frame: founder mid-laugh or mid-shock\n• Show review on screen as overlay\n• Cut to founder reaction\n• Cut to product B-roll mid-reaction\n• End with founder talking to camera (one line)\n\nTag the reviewer in the caption if their handle is public.'
    },
    post: {
      daysAfterShoot: 4,
      type: 'post',
      pillarId: 4,
      title: 'Reel: Founder reacts to spit-fire review',
      detail: 'Highest-emotion reaction reel.',
      brief: 'Source: Sunday\'s shoot.\n\nLead with Thomas H. review screenshot as cold open → cut to your reaction.\n\nFormat: Vertical, 30-40 sec, tag Thomas if public.'
    }
  },
  {
    id: 'hair-protection',
    name: 'Stylist POV hair protection',
    pillarId: 2,
    shoot: {
      dayOfWeek: 6,
      type: 'film',
      pillarId: 2,
      title: 'KEYSTONE: Hair protection / stylist shoot',
      detail: 'Salon location OR home setup with stylist friend.',
      brief: 'Shoot plan:\n• Bring 2 customer "witnesses" — one colour-treated, one curls\n• Stylist examines pre-shoot\n• B-roll: hair examination, scalp close-ups, Halo handling\n• On-camera: stylist endorsement (unscripted)\n\nOutput: 60-90 sec raw.'
    },
    prep: [
      {
        daysBeforeShoot: 4,
        type: 'engage',
        pillarId: 2,
        title: 'Book salon + confirm stylist for Sunday hair shoot',
        detail: 'DM 3 Sydney salons. Confirm one by end of day.',
        brief: 'Lead time: 4 days. Stylists book up fast.\n\nDM template:\n"Hey, I run Halo — Australian sauna hat brand. We\'re doing a content piece on hair protection in saunas with a stylist endorsement. Could we book your salon for 90 min on Sunday? Happy to compensate + tag the salon."\n\nBackup: Self-shoot at home with a hairdresser in your network.'
      },
      {
        daysBeforeShoot: 2,
        type: 'engage',
        pillarId: 2,
        title: 'Confirm 2 customer witnesses for Sunday hair shoot',
        detail: 'One colour-treated, one curls. Schedule arrival time.',
        brief: 'Target witnesses from review bank:\n• Colour-treated: Keira F., Freya P., Isabella Y.\n• Curls: Aurora Q., or any reviewer who mentioned curls\n\nDM offer: free mat + featured in upcoming reel.\n\nLock by end of Friday so they have weekend warning.'
      }
    ],
    edit: {
      daysAfterShoot: 3,
      type: 'edit',
      pillarId: 2,
      title: 'Edit hair protection reel',
      detail: 'Stylist POV. 30-sec final.',
      brief: 'Structure:\n• Hook (0-3s): "Your colourist can tell you\'ve been in the sauna."\n• Problem (3-12s): close-ups of damage, stylist describing\n• Solution (12-22s): cut to Halo, hair after 4 weeks of use\n• Reveal (22-30s): stylist reaction, CTA'
    },
    post: {
      daysAfterShoot: 5,
      type: 'post',
      pillarId: 2,
      title: 'Reel: hair protection (stylist POV)',
      detail: 'Pillar 2 anchor of the week.',
      brief: 'Caption: Open with stylist quote. Middle: Halo customer review (Keira F. or similar). End: "Stop choosing between sauna and your hair."'
    }
  },
  {
    id: 'education-carousel',
    name: 'Education carousel',
    pillarId: 6,
    shoot: {
      dayOfWeek: 0,
      type: 'post',
      pillarId: 6,
      title: 'Carousel: "Why your head cooks first"',
      detail: 'Design-only post. No filming. Built in Canva on Monday.',
      brief: 'Slide structure:\n1. Hook: "Your head cooks first in the sauna. Here\'s why."\n2. Anatomy: brain regulates body temp\n3. Hair as insulation paradox\n4. The 70°C scalp problem\n5. Why wool works\n6. Customer proof: 10→25 min jumps\n7. CTA: shop link\n\nUses Alegreya/Aleo. Save-worthy.'
    },
    edit: { daysAfterShoot: 0, type: 'post', pillarId: 6, title: '', detail: '', brief: '' },
    post: { daysAfterShoot: 0, type: 'post', pillarId: 6, title: '', detail: '', brief: '' }
  },
  {
    id: 'embarrassed-stories',
    name: 'Pattern interrupt story series',
    pillarId: 3,
    shoot: {
      dayOfWeek: 3,
      type: 'post',
      pillarId: 3,
      title: 'Story series: "Sauna hats people think look stupid vs Halo"',
      detail: '4 stories with poll stickers. Designed Thursday morning.',
      brief: 'Story flow:\n1. Poll: "Would you wear this?" + gnome hat image\n2. Same poll: Viking hat\n3. Same poll: towel-wrap method\n4. Halo product shot: "Or this."\n\nSave poll data for next week\'s carousel.'
    },
    edit: { daysAfterShoot: 0, type: 'post', pillarId: 3, title: '', detail: '', brief: '' },
    post: { daysAfterShoot: 0, type: 'post', pillarId: 3, title: '', detail: '', brief: '' }
  }
];

export const FIXED_TASKS: Array<Omit<GeneratedTask, 'order'>> = [
  {
    dayOfWeek: 0,
    type: 'engage',
    pillarId: null,
    title: 'DM 5 recent reviewers asking for UGC',
    detail: 'Offer free mat or 20% off for 15-sec clip.',
    brief: 'Template DM:\n"Hey [name], saw your review — loved the bit about [specific detail]. Would you be up for a 15-sec clip showing your sauna routine with the Halo? Happy to send you a free sauna mat as thanks. No pressure 🙏"'
  },
  {
    dayOfWeek: 1,
    type: 'engage',
    pillarId: null,
    title: 'Reply to every comment on Tuesday\'s post',
    detail: '30 min block after posting. Comment velocity = ranking signal.',
    brief: 'Replies that compound:\n• Ask a follow-up question (creates a thread)\n• Tag another commenter who said the same thing\n• Share a specific stat\n\nEvery reply in the first 24h expands distribution.'
  },
  {
    dayOfWeek: 2,
    type: 'film',
    pillarId: 4,
    title: 'Micro-film: 15-sec founder desk talk (optional)',
    detail: 'Phone only. Skip if nothing\'s on your mind that morning.',
    brief: 'Optional micro. Only film if you have something specific to say.\n\nIdeas:\n• Reflection on a customer call\n• "Behind the scenes — what I\'m working on today"\n• One-line product update or upcoming launch tease\n\nFormat: 15 sec max, vertical, single take, no editing.'
  },
  {
    dayOfWeek: 4,
    type: 'prep',
    pillarId: null,
    title: 'Pack tomorrow\'s shoot bag + lock locations',
    detail: 'Sat shoot starts in <24h. Friction-killer task.',
    brief: 'Shoot bag checklist:\n□ 2x Halo hats (hero + secondary)\n□ Sauna mat\n□ Thermal camera, charged\n□ Phone tripod\n□ Mic (if voiceover)\n□ Microfibre towel\n□ Water + electrolytes\n□ Backup phone charger\n□ Ricoh GR III\n\nLocations confirmed for Sat AND Sun?'
  },
  {
    dayOfWeek: 4,
    type: 'prep',
    pillarId: null,
    title: 'Plan next weekend\'s shoots — what content do you need?',
    detail: 'Review this week\'s performance. Adjust recipe selection.',
    brief: 'Friday review:\n□ Which reel got highest 3-sec retention?\n□ Which carousel got most saves?\n□ Any new high-emotion review come in?\n□ Are all 6 pillars covered next week?\n\nUse "Regenerate week" in Settings if you want a different recipe mix next week.'
  },
  {
    dayOfWeek: 6,
    type: 'engage',
    pillarId: null,
    title: 'Queue next week\'s posts in scheduler',
    detail: '15 min. Drop drafts for Tue-Fri in Later/Buffer/Meta Suite.',
    brief: 'Sunday wind-down task.\n\nQueue these:\n• Tue 7pm — thermal reel\n• Wed 6pm — founder reaction (or micro)\n• Thu 7pm — second founder reaction\n• Fri 6pm — hair reel + aesthetic reel\n\nRemoves "did I forget to post?" anxiety from weekdays.'
  },
  {
    dayOfWeek: 6,
    type: 'prep',
    pillarId: null,
    title: 'Pack Sunday evening — gear reset for next weekend',
    detail: 'Charge everything, clean lenses, dry the gear bag.',
    brief: 'Post-shoot reset:\n□ Charge thermal cam\n□ Charge Ricoh + GoPro\n□ Clean lenses\n□ Empty + dry gear bag\n□ Restock electrolyte packets\n\nFriday-you will thank Sunday-you.'
  }
];

const DEFAULT_RECIPE_IDS = ['thermal-demo', 'customer-interview', 'aesthetic-broll', 'founder-reactions', 'hair-protection', 'education-carousel', 'embarrassed-stories'];

function sortTasksByDay(tasks: GeneratedTask[]): GeneratedTask[] {
  const byDay: Record<number, GeneratedTask[]> = {};
  for (const t of tasks) {
    if (!byDay[t.dayOfWeek]) byDay[t.dayOfWeek] = [];
    byDay[t.dayOfWeek].push(t);
  }
  const typePriority: Record<string, number> = { prep: 0, film: 1, edit: 2, post: 3, engage: 4 };
  const ordered: GeneratedTask[] = [];
  for (const day of Object.keys(byDay).map(Number).sort()) {
    const dayTasks = byDay[day].sort((a, b) => (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99));
    dayTasks.forEach((t, i) => { t.order = i; ordered.push(t); });
  }
  return ordered;
}

// Creates prep + film tasks only. Edit/post are created downstream when film is marked done.
// Non-film recipes (carousels, stories) get all their tasks created immediately.
export function generateShootPlan(recipeIds: string[] = DEFAULT_RECIPE_IDS): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  const recipes = CONTENT_RECIPES.filter(r => recipeIds.includes(r.id));

  for (const recipe of recipes) {
    const shootDay = recipe.shoot.dayOfWeek;
    const isFilmRecipe = recipe.shoot.type === 'film';

    if (recipe.prep) {
      for (const prep of recipe.prep) {
        const prepDay = shootDay - prep.daysBeforeShoot;
        if (prepDay >= 0 && prepDay <= 6) {
          tasks.push({ dayOfWeek: prepDay, type: prep.type, pillarId: prep.pillarId, title: prep.title, detail: prep.detail, brief: prep.brief, order: 0, recipeId: recipe.id });
        }
      }
    }

    tasks.push({ dayOfWeek: shootDay, type: recipe.shoot.type, pillarId: recipe.shoot.pillarId, title: recipe.shoot.title, detail: recipe.shoot.detail, brief: recipe.shoot.brief, order: 0, recipeId: recipe.id });

    // Non-film recipes (carousel, story) create their output tasks immediately
    if (!isFilmRecipe) {
      if (recipe.edit.title) {
        const editDay = (shootDay + recipe.edit.daysAfterShoot) % 7;
        tasks.push({ dayOfWeek: editDay, type: recipe.edit.type, pillarId: recipe.edit.pillarId, title: recipe.edit.title, detail: recipe.edit.detail, brief: recipe.edit.brief, order: 0, recipeId: recipe.id });
      }
      if (recipe.post.title) {
        const postDay = (shootDay + recipe.post.daysAfterShoot) % 7;
        tasks.push({ dayOfWeek: postDay, type: recipe.post.type, pillarId: recipe.post.pillarId, title: recipe.post.title, detail: recipe.post.detail, brief: recipe.post.brief, order: 0, recipeId: recipe.id });
      }
    }
  }

  for (const fixed of FIXED_TASKS) {
    tasks.push({ ...fixed, order: 0 });
  }

  return sortTasksByDay(tasks);
}

// Returns the edit + post task definitions that should be created in the next week
// when a film task for the given recipe is marked done.
export function getRecipeDownstreamTasks(recipeId: string, shootDay: number): Array<Omit<GeneratedTask, 'order'>> {
  const recipe = CONTENT_RECIPES.find(r => r.id === recipeId);
  if (!recipe || recipe.shoot.type !== 'film') return [];

  const tasks: Array<Omit<GeneratedTask, 'order'>> = [];

  if (recipe.edit.title) {
    tasks.push({
      dayOfWeek: (shootDay + recipe.edit.daysAfterShoot) % 7,
      type: recipe.edit.type,
      pillarId: recipe.edit.pillarId,
      title: recipe.edit.title,
      detail: recipe.edit.detail,
      brief: recipe.edit.brief,
      recipeId,
    });
  }

  if (recipe.post.title) {
    tasks.push({
      dayOfWeek: (shootDay + recipe.post.daysAfterShoot) % 7,
      type: recipe.post.type,
      pillarId: recipe.post.pillarId,
      title: recipe.post.title,
      detail: recipe.post.detail,
      brief: recipe.post.brief,
      recipeId,
    });
  }

  return tasks;
}

// Legacy: creates all tasks including edit/post. Used for backwards compat + seed.
export function generateWeek(recipeIds: string[] = DEFAULT_RECIPE_IDS): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  const recipes = CONTENT_RECIPES.filter(r => recipeIds.includes(r.id));

  for (const recipe of recipes) {
    const shootDay = recipe.shoot.dayOfWeek;

    if (recipe.prep) {
      for (const prep of recipe.prep) {
        const prepDay = shootDay - prep.daysBeforeShoot;
        if (prepDay >= 0 && prepDay <= 6) {
          tasks.push({ dayOfWeek: prepDay, type: prep.type, pillarId: prep.pillarId, title: prep.title, detail: prep.detail, brief: prep.brief, order: 0, recipeId: recipe.id });
        }
      }
    }

    tasks.push({ dayOfWeek: shootDay, type: recipe.shoot.type, pillarId: recipe.shoot.pillarId, title: recipe.shoot.title, detail: recipe.shoot.detail, brief: recipe.shoot.brief, order: 0, recipeId: recipe.id });

    if (recipe.edit.title) {
      const editDay = (shootDay + recipe.edit.daysAfterShoot) % 7;
      tasks.push({ dayOfWeek: editDay, type: recipe.edit.type, pillarId: recipe.edit.pillarId, title: recipe.edit.title, detail: recipe.edit.detail, brief: recipe.edit.brief, order: 0, recipeId: recipe.id });
    }

    if (recipe.post.title) {
      const postDay = (shootDay + recipe.post.daysAfterShoot) % 7;
      tasks.push({ dayOfWeek: postDay, type: recipe.post.type, pillarId: recipe.post.pillarId, title: recipe.post.title, detail: recipe.post.detail, brief: recipe.post.brief, order: 0, recipeId: recipe.id });
    }
  }

  for (const fixed of FIXED_TASKS) {
    tasks.push({ ...fixed, order: 0 });
  }

  return sortTasksByDay(tasks);
}

export const DAY_LABELS_GENERATED = {
  0: { label: 'Edit + design day', note: 'Editing Sat\'s footage. Designed posts only. Engage with reviewers.' },
  1: { label: 'Big posting day', note: 'Post Sat\'s thermal reel — Tuesday gets highest IG reach.' },
  2: { label: 'Mid-week post + prep', note: 'Optional founder micro. Prep for upcoming shoots.' },
  3: { label: 'Founder reaction day', note: 'Post Sun\'s founder reactions. Run the story poll series.' },
  4: { label: 'Aesthetic + wind-down', note: 'Last posts. Pack tomorrow\'s shoot bag. Plan next week.' },
  5: { label: 'KEYSTONE SHOOT — Day 1', note: 'Block 9am-3pm. Multiple shoots back-to-back.' },
  6: { label: 'KEYSTONE SHOOT — Day 2', note: 'Block 9am-2pm. Last shoots + queue next week\'s posts.' }
};
