/*
 * GGAI content playbooks. Written by Growth GenAI.
 * Each playbook tells the writer how to shape one format and which JSON to return.
 */

const INTENTS = `INTENTS (use the one in the brief; if none, choose the best fit and keep ONE):
- Educating: teach a method. CTA: "Follow for more on <topic>".
- Nurturing: a story, a lesson, behind the scenes. CTA: a question to the reader, or Follow.
- Engagement: a contrarian take. CTA: one direct question.
- Soft selling: a result or a free resource, no hard pitch. CTA: "Comment <KEYWORD> for <free thing>".
- Hard selling: the offer itself. CTA: "Comment or DM <KEYWORD>" or "Book a call".
If the brief has a "CTA:" line, use it exactly.`;

const CAROUSEL_JSON = (n: number) => `Return JSON:
{"title": string (deck name), "intent": string,
 "slides": [ exactly ${n} items. Slide 1 {"kind":"cover","heading": 4-8 words,"body": 8-15 word subtitle},
   middle slides {"kind":"content","heading": max 8 words,"body": max 30 words OR "bullets": 2-4 short lines, "visual": one-line description of a simple illustration},
   last slide {"kind":"cta","heading": max 8 words,"body": the CTA line} ],
 "caption": LinkedIn caption, 60-150 words, hook first line, ends with the CTA}`;

export const PLAYBOOKS: Record<string, { name: string; guide: (p: { slides: number; seconds: number; minutes: number }) => string }> = {
  carousel: {
    name: 'Carousel',
    guide: ({ slides }) => `FORMAT: LinkedIn carousel, ${slides} slides, portrait 4:5.
Every slide earns the swipe: one idea per slide, short lines, no paragraphs.
Cover: a promise or a tension the reader feels, never a label. Slide 2 names the cost of the problem.
Middle slides move step by step. Last slide: the CTA that matches the intent.
${INTENTS}
${CAROUSEL_JSON(slides)}`,
  },
  'intent-carousel': {
    name: 'Intent carousel',
    guide: ({ slides }) => `FORMAT: intent-led LinkedIn carousel, ${slides} slides.
Build the whole deck from the intent: the cover stops the scroll for that intent, the flow builds toward it, the last slide asks for exactly the intent's CTA.
Cover formulas to choose from: a surprising number from the notes, a "you're doing X, do Y" correction, a before/after, a question the reader asks themselves.
${INTENTS}
${CAROUSEL_JSON(slides)}`,
  },
  listicle: {
    name: 'Listicle cheatsheet',
    guide: ({ slides }) => `FORMAT: save-worthy listicle. Cover states the number and the payoff.
Each content slide = one point: heading is the point, bullets are up to 4 short takeaways.
${INTENTS}
${CAROUSEL_JSON(slides)}`,
  },
  comparison: {
    name: 'Comparison cheatsheet',
    guide: ({ slides }) => `FORMAT: comparison (X vs Y, old way vs new way, myth to reality).
Each content slide compares one dimension: heading names the dimension, bullets: "Old: …" then "New: …".
${INTENTS}
${CAROUSEL_JSON(slides)}`,
  },
  'dos-donts': {
    name: "Do's and don'ts",
    guide: ({ slides }) => `FORMAT: do's and don'ts cheatsheet.
Each content slide: heading is the situation, bullets: "Don't: …" then "Do: …".
${INTENTS}
${CAROUSEL_JSON(slides)}`,
  },
  'image-post': {
    name: 'Image post',
    guide: () => `FORMAT: one image post. The eye must get the idea in two seconds.
Pick 2-6 words of on-image text. Pick a shape (square, portrait or landscape) and a style: Hyper-realistic, Editorial, Cinematic, Lifestyle candid or Brand graphic.
If the brief asks for do's and don'ts, a comparison or a list, design it as a clean cheatsheet graphic and put the key lines in onImageText (max 40 words).
Set includeFounder true only if the brief puts the founder in the picture (me, my photo, founder, speaking).
${INTENTS}
Return JSON: {"title": string, "intent": string, "onImageText": string, "shape": "square"|"portrait"|"landscape",
 "style": string, "includeFounder": boolean,
 "imagePrompt": a detailed prompt for an image model: scene, composition, lighting, where the on-image text sits, using the brand colours,
 "caption": 60-150 word caption ending with the CTA}`,
  },
  'intent-post': {
    name: 'Intent-driven post',
    guide: () => `FORMAT: LinkedIn text post, 120-220 words.
Hook: under 12 words, starts with I, You, If, When, or a quoted line. Line two earns the "see more".
Short paragraphs of 1-2 lines. One idea. End with the CTA that matches the intent.
${INTENTS}
Return JSON: {"title": string, "intent": string, "hook": string, "body": string (the rest of the post, blank lines between paragraphs, no hook repeated), "cta": string, "hashtags": [max 3]}`,
  },
  'story-post': {
    name: 'Story-flow post',
    guide: () => `FORMAT: story-flow LinkedIn post, 150-250 words.
Beats: the moment (place, time, what happened) → what I believed → the turn → the lesson in one line → what the reader can take.
Only use stories that exist in the notes or the brief. If no real story exists, write it as a lesson, never invent one.
Hook: under 12 words, starts with I, You, If, When, or a quoted line.
${INTENTS}
Return JSON: {"title": string, "intent": string, "hook": string, "body": string, "cta": string, "hashtags": [max 3]}`,
  },
  'framework-post': {
    name: 'Framework post',
    guide: () => `FORMAT: framework LinkedIn post, 150-250 words.
Hook names the outcome. Then a named framework or numbered steps (3-7), each one line plus one line of why.
Close with the one mistake people make, then the CTA.
${INTENTS}
Return JSON: {"title": string, "intent": string, "hook": string, "body": string, "cta": string, "hashtags": [max 3]}`,
  },
  newsletter: {
    name: 'Newsletter',
    guide: () => `FORMAT: email newsletter issue. Written to ONE reader, with ONE goal (a reply, a click or a booking) and ONE action.
Subject under 42 characters, curiosity without clickbait. Preheader under 90 characters.
Open with a scene or a sharp line, 3-5 short sections, then the action, then a P.S. that gives a second reason to act.
Return JSON: {"title": string, "subject": string, "preheader": string,
 "heroPrompt": prompt for a warm editorial illustration that matches the theme, in the brand colours, no text,
 "sections": [{"heading": string, "body": string}], "action": {"label": string, "detail": string}, "ps": string}`,
  },
  reel: {
    name: 'Reel',
    guide: ({ seconds }) => `FORMAT: short-form video script, ${seconds} seconds total, spoken by the founder to camera.
Name the platform (Instagram Reels, TikTok, YouTube Shorts or LinkedIn video; default Instagram Reels).
Beat 1 is the hook (first 2 seconds, pattern interrupt). About 2.5 spoken words per second in total.
Return JSON: {"title": string, "platform": string, "seconds": ${seconds}, "hook": string,
 "beats": [{"label": string, "say": string, "onScreen": string, "shot": string}], "cta": string, "caption": string}`,
  },
  video: {
    name: 'Long video',
    guide: ({ minutes }) => `FORMAT: long-form video script, about ${minutes} minutes (roughly ${minutes * 140} spoken words).
Name the format (Tutorial, Story, Breakdown, Q&A). Cold open in the first 20 seconds, then chapters, then the CTA.
Return JSON: {"title": string, "format": string, "minutes": ${minutes}, "coldOpen": string,
 "chapters": [{"title": string, "script": string, "bRoll": string}], "cta": string,
 "description": YouTube/LinkedIn description, 80-150 words}`,
  },
  answer: {
    name: 'Ask your brain',
    guide: () => `TASK: answer the question using only the notes. Cite note names in brackets like [voice-dna].
If the notes do not hold the answer, say exactly that.
Return JSON: {"title": short title, "answer": string (markdown allowed), "cited": [note ids]}`,
  },
};
