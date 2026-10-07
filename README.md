# GGAI Business Brain

**Your second brain, live at your own web address.** Upload the notes you built with Claude, set your Brand Kit once, then make carousels, newsletters, image posts, text posts, reel scripts and video scripts that sound like you and look like your brand.

By **Growth GenAI** · growthgenai.in

---

## Install your own copy (about 10 minutes)

You need: a GitHub account, a Vercel account (sign up with **Continue with GitHub**), and an OpenAI API key with credit.

1. Click this button:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FGrowthGenAI%2Fggai-biz-brain&project-name=my-business-brain&repository-name=my-business-brain&env=OPENAI_API_KEY,APP_PASSWORD&envDescription=OPENAI_API_KEY%20is%20your%20OpenAI%20key%20(starts%20sk-).%20APP_PASSWORD%20is%20the%20password%20you%20will%20type%20to%20open%20your%20dashboard.&stores=%5B%7B%22type%22%3A%22blob%22%7D%5D)

2. Vercel asks you to create a copy in your GitHub. Keep the name, keep **Private**, click **Create**.
3. When it asks for storage, add the **Blob** store (one click, free).
4. Fill in the two settings:
   - `OPENAI_API_KEY`: your key from platform.openai.com → API keys (starts with `sk-`)
   - `APP_PASSWORD`: any password you will remember. You type it to open your dashboard.
5. Click **Deploy** and wait 2 to 4 minutes.
6. Open the link under **Domains** (ends in `.vercel.app`), log in with your password, and bookmark it.

## First time inside

1. **Brain** → zip your whole Second Brain folder and upload it.
2. **Brand Kit** → upload your face and logo → **Fill from my brain** → check every field → **Save brand system**.
3. **Studio** → type `/` and pick a format, or paste a prompt from your `content-prompts.html` or 30-day calendar.

## Commands

| Command | Makes |
|---|---|
| `/carousel` | LinkedIn carousel in your colours, with your photo. **Download PDF** for LinkedIn's "Add a document". |
| `/newsletter` | Email issue with a header illustration. Copy as text or as email HTML. |
| `/image` | One on-brand image with words and a caption. |
| `/text` | LinkedIn or X post in your voice. |
| `/reel` | Short video script (15 to 90 seconds). |
| `/video` | Long video script with chapters. |
| no command | Ask your brain a question; it answers from your notes only. |

Helpful lines in a prompt: `7 slides`, `30 seconds`, `8 minutes`, `Intent: Educating`, `Source: brand-messaging, icp`, `CTA: Comment ENGINE for the checklist`.

## Weekly routine

Drop new material into `00-Inbox` of your Second Brain, let Claude update the Wiki, then zip the folder and **Upload vault** again.

## Costs

Hosting on Vercel's free Hobby plan and Blob storage are free at this size. OpenAI is pay-as-you-go: a text post costs a fraction of a rupee; each AI image costs a few rupees. Set a monthly limit on platform.openai.com.

## Settings (Vercel → Project → Settings → Environment Variables)

| Name | Needed | What it is |
|---|---|---|
| `OPENAI_API_KEY` | yes | Your OpenAI key |
| `APP_PASSWORD` | yes | Dashboard password |
| `BLOB_READ_WRITE_TOKEN` | auto | Added when you connect the Blob store |
| `OPENAI_MODEL` | no | Text model, default `gpt-4.1` |
| `OPENAI_IMAGE_MODEL` | no | Image model, default `gpt-image-1` |

After changing a setting: **Deployments → ⋯ → Redeploy**.

---

© Growth GenAI. Licensed for use by Growth GenAI clients. See LICENSE.
