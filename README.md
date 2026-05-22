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

3. Sign in once. New profiles are created as `Teacher`, except bootstrap admin emails.
5. Admins can assign `Teacher`, `Studio Team`, and `Admin/Adviser` roles from the app.

Teachers only paste Google Drive links; the app does not upload video files.
