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

Broadcast Desk status changes to `Approved`, `Needs Revision`, or `Rejected` now create a locked-down `mail` queue document addressed to the announcement submitter. Actual email delivery requires Firebase's Trigger Email extension, or an equivalent Cloud Function, to be configured for the `mail` collection. `Needs Revision` and `Rejected` require a submitter-facing note before the status can be saved.

### Broadcast Desk Email Delivery Setup

The app is already writing email jobs to Firestore in the `mail` collection. To actually send those emails, install Firebase's official `Trigger Email from Firestore` extension or replace it later with a Cloud Function.

Recommended extension settings:

- Extension: `Trigger Email from Firestore`
- Firebase project: `announcementssubmission`
- Email documents collection: `mail`
- Default FROM address: a school-approved sender, such as `Broadcast Desk <noreply@doralacademynv.org>` if available
- Default REPLY-TO address: `joseph.clark@doralacademynv.org` or another monitored staff address
- Users collection: leave blank
- Templates collection: leave blank for now

What is still needed:

- The Firebase project must be on the Blaze pay-as-you-go plan to install Firebase Extensions.
- An outgoing mail provider must be configured with SMTP credentials. Common options are SendGrid, Mailgun, Mailchimp Transactional, or another approved SMTP provider.
- Gmail/Google SMTP may work only if the sending account allows either app passwords or OAuth. App passwords require 2-Step Verification and may be disabled by Google Workspace admin policy. OAuth is more secure but usually requires more Google Cloud setup and may also require Workspace/admin approval.
- Do not store SMTP passwords or provider API keys in this repository. Put those secrets directly into Firebase Extension configuration or Google Secret Manager.

Current app behavior after setup:

- Approving an announcement queues an email to the submitting teacher.
- Marking an announcement `Needs Revision` queues an email with the required studio note.
- Marking an announcement `Rejected` queues an email with the required studio note.
- Firestore rules restrict `mail` document creation so staff can only queue status emails to the original announcement submitter.

Teachers only paste Google Drive links; the app does not upload video files.

Video Production Studio is a separate direct-entry app at `video-production.html`. It is intentionally not linked from Broadcast Desk, and Broadcast Desk is not linked from Video Production Studio.

Video Production teachers can create class periods with join codes. Students must join an active period by code before they can see period projects or filming workflows, and admins can also add students to periods manually from Users. Teachers/admins can seed an idempotent fake roster from Manage Periods for safe practice; it creates predictable demo periods and demo student enrollments without Firebase Auth accounts. The DCC practice roster is created/restored for `joseph.clark@doralacademynv.org` from the Video Production Studio Periods area; it creates DCC Periods 1-3 with 30 roster students per period for practicing project creation, grouping, and progress monitoring, and records are internally marked with `seededRosterBatch: "dcc-practice-roster-2026"`. Projects can now be assigned to multiple periods at once and to Units 1-4; Teacher Monitor filters by Period, then Unit, then Assignment/Project, with existing projects that do not have a unit treated as Unit 1. Each period has separate drag-and-drop student groups with a ghost "Add new group?" drop zone. Archived periods are hidden from active workflows and selectors, can be viewed from the Periods tab, and can be restored or permanently deleted from the archived classes view. Teachers and admins can preview a period from Monitor with the eye button, and the project page keeps its project-level student preview.

Video Production workflow progress is tracked per project, period, and group in `projectGroupWorkflows`. Teacher Monitor shows separate group progress cards for the selected period, and student checklist/status updates affect only the student's assigned group.

The Video Production Grade tab lets teachers/admins grade by Period -> Unit -> Assignment/Project. Student groups paste Google Drive submission links in their filming workflow, Drive previews are embedded when Google allows it, and the app does not download or proxy student videos through the server. Grades, published feedback, private teacher notes, and submission metadata are stored per project, period, and group in `projectGroupWorkflows`; existing projects without a unit are treated as Unit 1.

Student submissions now include Planning / Pre-Production writing plus a 7-category, 10-point student self-assessment rubric. The Grade tab shows the student self-score with an expandable category breakdown, while teachers use the same 7-category rubric for the official group-scoped grade by project, period, and group. Private teacher notes are stored separately from student-readable workflow data.

Video Production submissions support version history. Each explicit student submit creates a new immutable version scoped to the project, period, and group, preserving the Google Drive link, planning text, self-assessment, optional student note, submitter, and timestamp. Existing non-versioned submissions appear as Version 1, teachers can view previous versions and set version statuses from the Grade tab, and the app continues to store only Google Drive links rather than downloading student videos.

Video Production groups now use a Project Status Pipeline tracked per project, period, and group: Not Started, Planning, Filming, Editing, Submitted, Reviewed, Needs Revision, and Final Approved. The checklist in the student workflow is a Daily Recording Checklist, resets by `YYYY-MM-DD` using the school/local `America/Los_Angeles` date key, and no longer includes project-milestone items such as script finalized, shot-list completed, intro/interview/B-roll/outro filmed.

Teacher Monitor shows a read-only 7-step Project Status meter for each group, where Planning is 1/7 and Final Approved is 7/7. Group card color shifts from red at Not Started toward green at Final Approved, and the Monitor card also shows a separate Daily Checklist Progress bar without status editing or latest activity sections.
