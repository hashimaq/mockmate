# Voice Interview Setup

## 1. Apply migration

Run in Supabase SQL Editor (after `001`–`006`):

- `supabase/migrations/007_voice_settings.sql`

## 2. Restart the app

```bash
npm run dev
```

## Browser notes

- **Speech-to-text:** Chrome / Edge (Chromium) recommended. Safari support is limited/partial.
- **Text-to-speech:** Most modern browsers via `speechSynthesis`.
- Microphone permission is required for Voice Answer.
