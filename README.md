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

3. Sign in once. Your new profile is created as `Teacher`.
4. In Firestore, promote the adviser account at `users/{uid}` by setting `role` to `Admin/Adviser`.
5. The admin can then assign `Teacher`, `Studio Team`, and `Admin/Adviser` roles from the app.

Teachers only paste Google Drive links; the app does not upload video files.
