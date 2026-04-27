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

From **Story Settings → API Configuration**, you can now use:

- **Gemini API** (default)
- **OpenAI**
- **OpenRouter** (includes free model options)
- **Groq**
- **Together AI**
- **DeepSeek**
- **Ollama** (local/free, no API key needed)
- **Custom / OpenAI-compatible**

For Gemini, the app can use an in-app key or fallback to `GEMINI_API_KEY` / `API_KEY` from `.env.local`.

## Build Android APK

To build the Android application locally, follow these steps:

1. Install dependencies using bun:
   `bun install`
2. Build the web application:
   `bun run build`
3. Sync Capacitor:
   `bun x @capacitor/cli sync`
4. Build the APK using Gradle:
   `cd android && ./gradlew assembleDebug`

The generated debug APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.
