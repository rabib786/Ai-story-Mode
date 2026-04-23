<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1iV2W08bTRbGmy5w1gYr6jt9TMncEAdsu

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (optional if you configure keys in-app)
3. Run the app:
   `npm run dev`

## API Providers

The app now supports two providers from **Story Settings → API Configuration**:

- **Gemini API** (default)
  - Uses an in-app Gemini key, or falls back to `GEMINI_API_KEY` / `API_KEY` from `.env.local`.
- **Custom / OpenAI-Compatible**
  - Configure Base URL, API key, and model for any OpenAI-compatible `/chat/completions` endpoint.
