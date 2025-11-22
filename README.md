<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1YvYCfGx06nqceNQiFxyh6nlTh6x7xfQv

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploying

 - **Push to GitHub**: create a repository on GitHub, then run:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-git-remote-url>
git branch -M main
git push -u origin main
```

- **Deploy Frontend to Vercel** (recommended for this repo):

1. Sign in to Vercel and import the GitHub repository.
2. Ensure the Vercel project settings use the default build command `npm run build` and the output directory `dist`.
3. Add any environment variables (e.g. `GEMINI_API_KEY`) in the Vercel dashboard under Settings → Environment Variables.

Notes:
- This repository contains a small Express `server/` intended for local development (it serves static files in production). Vercel is used here to deploy the frontend only as a static site. If you want to host the Express server too, consider services that support long-running Node servers (Render, Fly, or a VPS), or refactor server endpoints into Vercel Serverless Functions under `api/`.

