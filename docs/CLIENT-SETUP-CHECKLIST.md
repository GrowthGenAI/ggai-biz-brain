# GGAI Business Brain: client setup checklist

Master list of every step, in order. The client playbook is built from this list.
Everything carries the client's brand and Growth GenAI skills only.

## Day 1 · Foundation (client's computer)
1. Claude Desktop installed, paid plan, Code tab opens a local session (Git installed: `xcode-select --install` on Mac).
2. Folder `[Client Name] Growth Brain` on the Desktop.
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
10. Zip the Growth Brain folder → dashboard **Brain** → Upload vault (note count matches, constellation shows).
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
18. **Planner + auto-posting** (approve & schedule, daily 9 AM IST posting, CSV sheet). Switch on only when the client is ready.

    **Simple route for clients (recommended): reuse the GGAI apps, the client only presses Connect.**
    Growth GenAI already owns one LinkedIn app (Growth GenAI Brain) and one Meta app (GGAI Brain Poster).
    For each new client dashboard:
    a. LinkedIn app → Auth → Authorized redirect URLs → add `https://[client-domain]/api/linkedin/callback`.
    b. Meta app → API setup with Instagram login → Business login settings → add `https://[client-domain]/api/instagram/callback`.
    c. Meta app → App roles → Roles → Add people → **Instagram Tester** → client's Instagram username.
       Client accepts at instagram.com/accounts/manage_access → Tester Invites → Accept. (Until the app passes Meta App Review.)
    d. Client's Vercel → Settings → Environments → Production → Add (Secret): the same `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`,
       `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, plus their own `CRON_SECRET` → Save → Redeploy.
    e. Client: dashboard → Planner → Connect LinkedIn → Allow; Connect Instagram → Allow. Done.
    Client's Instagram must be a professional account first (check: instagram.com → Profile shows "Professional dashboard";
    switch on the phone app: ☰ → Settings and privacy → For professionals → Account type and tools → Switch to professional account → Business).

    **Full route (a client who wants their own apps)**
    **A. LinkedIn app (15 min)**
    1. linkedin.com/developers/apps → Create app → name `[Brand] Brain`, LinkedIn Page = the client's company page
       (no page yet? LinkedIn → For Business → Create a Company Page), logo, tick the agreement → Create app.
    2. If asked, Verify the app: Settings → Verify → Generate URL → open it as the page admin → Verify.
    3. Products tab → Request access: **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn** (both show Added).
    4. Auth tab → OAuth 2.0 settings → Authorized redirect URLs → ✏️ → Add → `https://[client-domain]/api/linkedin/callback` → Update.
    5. Auth tab shows Client ID and Client Secret (eye icon). The client copies them; never into chat.
    **B. Instagram (20 min)**
    1. Professional account check / switch (see above).
    2. developers.facebook.com/apps → Create App → name → on "Add use cases" click the **Content management** filter (not Featured) →
       tick **Manage messaging & content on Instagram** → Next → business portfolio (the client's verified one) → Next → Create app.
       (If the app shows "App type: None" with only "Instagram Graph API → Business API settings", it was made without the use case: create a new app.)
    3. Use cases → Customize (Instagram) → **API setup with Instagram login**:
       - Section 1: Add all required permissions. Then Permissions and features → `instagram_business_content_publish` → + Add ("Ready for testing" is fine).
       - Section 2: Roles → Add people → Instagram Tester → the Instagram username → accept at instagram.com/accounts/manage_access → Tester Invites → Accept.
       - Section 3 (webhooks): skip.
       - Section 4: Set up Instagram business login → Redirect URL `https://[client-domain]/api/instagram/callback` → Save.
       - Copy **Instagram app ID** and **Instagram app secret** (Show) from the top of this page, not the Facebook App ID.
    **C. Vercel keys**: Settings → Environments → Production → Environment Variables → Add (Secret) → "+ Add new variable" for each:
       `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `CRON_SECRET` → Save → Redeploy.
       Ignore "Needs Attention" on BLOB_READ_WRITE_TOKEN; never click Rotate Blob Credentials.
    **D. Connect**: Planner → Connect LinkedIn → Allow; Connect Instagram → Allow (cards show Connected).
    **E. Use it**: any text post, carousel or image → Approve & schedule → tick LinkedIn / Instagram → date → edit captions → Schedule (or Post now).
       Planner shows Scheduled → Posted with links; Download sheet (CSV) for the monthly tracker.
    **Checks**: before keys are added the Planner shows a red "Add …" banner and test rows show Failed (expected; remove them).
       LinkedIn connection lasts 60 days (Reconnect from the Planner); Instagram renews itself weekly; Instagram API posts max 10 slides.
19. Outreach (prospect-magnet skill + tracker), masterclasses, AI video clone: separate offers.

## Rules
- Never collect the client's API keys in chat or screenshots; they type them into Vercel themselves.
- Turn off any non-GGAI skills in the client's Claude account.
- Carousels: 1080 × 1350 everywhere; LinkedIn = one PDF with a document title; Instagram = up to 20 images (API posting: 10).
