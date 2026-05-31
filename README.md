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

Video Production teachers can create class periods with join codes. Students must join an active period by code before they can see period projects or filming workflows, and admins can also add students to periods manually from Users. Teachers/admins can seed an idempotent fake roster from Manage Periods for safe practice; it creates predictable demo periods and demo student enrollments without Firebase Auth accounts. The DCC practice roster is created/restored for `joseph.clark@doralacademynv.org` from the Video Production Studio Periods area; it creates DCC Periods 1-3 with 30 roster students per period for practicing project creation, grouping, and progress monitoring, and records are internally marked with `seededRosterBatch: "dcc-practice-roster-2026"`. Projects can now be assigned to multiple periods at once, and each period has separate drag-and-drop student groups with a ghost "Add new group?" drop zone. Archived periods are hidden from active workflows and selectors, can be viewed from the Periods tab, and can be restored or permanently deleted from the archived classes view. Teachers and admins can preview a period from Monitor with the eye button, and the project page keeps its project-level student preview.

Video Production workflow progress is tracked per project, period, and group in `projectGroupWorkflows`. Teacher Monitor shows separate group progress cards for the selected period, and student checklist/status updates affect only the student's assigned group.
