# Broadcast Desk

Dark, mobile-first school news announcement management for teachers, studio teams, and advisers.

## Run Locally

This project uses browser ESM imports for React, Tailwind, Firebase, and icons, so there is no install step.

```bash
node server.mjs
```

Open `http://localhost:4173`.

## Firebase Setup

1. Enable Google Sign-In in Firebase Authentication.
2. Deploy the Firestore rules:

```bash
firebase deploy --only firestore:rules
```

3. Sign in as `joseph.clark@doralacademynv.org` or `koby.walsh@doralacademynv.org`.
4. Assign additional admins or studio crew by email from the Admin page.

Teachers do not need pre-created user records. A Google account ending in `@doralacademynv.org` can submit announcements automatically. Student accounts ending in `@student.doralacademynv.org` need an active `authorizedUsers` assignment with role `studioCrew` or `admin`.

Teachers only paste Google Drive links; the app does not upload video files.
