# GGAI Business Brain: client setup checklist

Master list of every step, in order. The client playbook is built from this list.
Everything carries the client's brand and Growth GenAI skills only.

## Day 1 · Foundation (client's computer)
1. Claude Desktop installed, paid plan, Code tab opens a local session (Git installed: `xcode-select --install` on Mac).
2. Folder `[Client Name] Second Brain` on the Desktop.
3. Run the GGAI **business-authority-foundation** skill: 7 questions → 6 Foundation files
   (icp, brand-messaging, rule-of-one, brand-positioning, business-in-a-box, voice-dna).
4. Point the Code tab at the folder. Open the folder in Obsidian as a vault.

## Day 2 · Build
5. Accounts: GitHub, Vercel (sign up with GitHub), OpenAI API key on platform.openai.com with $10 credit and a $20 monthly limit.
6. Run the GGAI **brand-visual-identity** skill → visual identity deck (HTML) + brand-identity.md.
7. Run the five build prompts in one Code session: business authority, content engine, structure, the build, brand identity.
   Check: Foundation/ has business-authority.md, content-engine.md, brand-identity.md; CLAUDE.md starts with the client's name; Obsidian graph shows clusters.
8. Put the profile banner on LinkedIn (1584 × 396) and the headshot on LinkedIn and Instagram.

## Day 3 · Deploy
9. Deploy the dashboard: Deploy button in the GGAI repo README → Vercel → keep the repo private →
   add **Blob store (Public + read-write token)** → `OPENAI_API_KEY` → `APP_PASSWORD` →
   `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_APP_BYLINE` / `NEXT_PUBLIC_APP_LOGO_URL` for the client's brand → Deploy → bookmark the Domains link.
10. Zip the Second Brain folder → dashboard **Brain** → Upload vault (note count matches, constellation shows).
11. **Brand Kit**: headshot, logo, Fill from my brain, Handle = brand name (not a URL), Role, strategic voice text, never-say list → Save.
12. Run the GGAI **content-prompt-studio** skill in the Code tab → content-prompts.html (6 prompts, one keyword).
13. **Command Centre** (the AI team screen: Chief → Strategist / Research → Content → formats, / menu, voice input):
    make a carousel, a newsletter and an image from the prompts. Carousel → **LinkedIn PDF** (1080 × 1350, document title) and **Instagram images**.
14. Publish one piece (LinkedIn: + → Add a document → PDF → title).
15. Run the GGAI **thirty-day-content-plan** skill → content-plan-30-days.html.

## After · every day (2 minutes)
16. Drop new material into 00-Inbox → Code tab: "Read CLAUDE.md and follow it. Process anything new in 00-Inbox, update the Wiki and Index, then draft one post from the strongest idea and save it to Drafts."
17. Once a week: zip the folder → Upload vault again.

## Optional add-ons (switch on per client)
18. **Planner + auto-posting** (approve & schedule, daily 9 AM IST posting, CSV sheet):
    LinkedIn developer app (OpenID Connect + Share on LinkedIn, redirect /api/linkedin/callback),
    Instagram Business account + Meta app (Instagram API with Instagram login, redirect /api/instagram/callback),
    Vercel keys LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, CRON_SECRET → Planner → Connect.
19. Outreach (prospect-magnet skill + tracker), masterclasses, AI video clone: separate offers.

## Rules
- Never collect the client's API keys in chat or screenshots; they type them into Vercel themselves.
- Turn off any non-GGAI skills in the client's Claude account.
- Carousels: 1080 × 1350 everywhere; LinkedIn = one PDF with a document title; Instagram = up to 20 images (API posting: 10).
