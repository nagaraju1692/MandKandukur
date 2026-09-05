# Mana Kandukur - Mobile (Expo)

This folder contains a minimal Expo React Native skeleton to start migrating the existing web app to mobile.

Quick start

```bash
cd mobile
npm install
npx expo start
```

Backend configuration

1. Copy `backend/.env.example` to `backend/.env` and set your PostgreSQL `DATABASE_URL`.
2. Run `npm install` and `npm run dev` from `backend`.
3. Keep the deployed backend URL in `.env` as the default.
4. For local development, create `.env.local` with `EXPO_PUBLIC_API_URL=http://<computer-lan-ip>:4000`. Expo loads `.env.local` after `.env`, so the local URL overrides the deployed URL without changing the shared configuration.
5. Restart Expo after changing either environment file. The included `.env.local` currently uses `http://172.20.10.13:4000`; update it if the computer's LAN IP changes.

The mobile app loads categories, businesses, announcements, image URLs, and gallery image URLs from the backend. PostgreSQL table data must use the response fields shown in `backend/README.md`.

Notes

- I created a basic `App.tsx` with React Navigation and two placeholder screens.
- You can reuse non-UI code from `frontend/src/services` and `frontend/src/utils` — extract them into a shared package or copy them into `mobile/src/services`.
- Next steps: install navigation dependencies, port pages from `frontend/src/pages` to `mobile/src/screens`, adapt styles to React Native, and integrate the API.

Push notifications (new version alerts)

- `src/services/pushNotifications.ts` requests permission, creates the Android `updates` channel, and registers an Expo push token using `extra.eas.projectId` from `app.json`. Registration runs on app start from `NotificationContext` and the token is also sent to the backend via `registerPushToken` (`src/services/api.ts`).
- `extra.eas.projectId` must contain your real EAS project ID. If it is missing, run `npx eas init` (or `eas project:init`) and it will be written into `app.json` automatically.
- Standalone APK builds need FCM for push to work while the app is closed: download `google-services.json` from the Firebase console for package `com.manakandukur.directory`, reference it via `"android": { "googleServicesFile": "./google-services.json" }` in `app.json`, and upload FCM credentials to Expo with `eas credentials` (or a service-account key in the EAS dashboard).
- After a release, a sender (e.g. the backend, out of scope here) must POST to `https://exp.host/--/api/v2/push/send` with each stored token and a body like `{ "to": "<ExponentPushToken[...]>", "title": "New version available", "body": "...", "data": { "type": "update" }, "channelId": "updates" }`. Tapping it triggers the existing update flow (opens the APK download URL from the latest GitHub release).
