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
