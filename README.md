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

Studio crew and admins can use Teleprompter Mode to display the finalized daily rundown script. It reads from `rundowns/{date}` and, when present, matching `rundownItems` documents.

Each daily rundown also includes a Studio Checklist stored on `rundowns/{date}.checklistItems` for live setup tracking across studio devices.

When Studio marks an announcement `Approved`, it is automatically added to each matching daily rundown. There is no separate approval step.

Teachers only paste Google Drive links; the app does not upload video files.

Video Production Studio is a separate direct-entry app at `video-production.html`. It is intentionally not linked from Broadcast Desk, and Broadcast Desk is not linked from Video Production Studio.
