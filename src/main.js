import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { html } from "htm/react";
import {
  Archive,
  CalendarDays,
  Check,
  Clipboard,
  Clapperboard,
  ExternalLink,
  Film,
  Filter,
  GripVertical,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogIn,
  LogOut,
  Maximize,
  Megaphone,
  Minus,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCcw,
  Rewind,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Unlock,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  addDoc,
  auth,
  collection,
  db,
  deleteDoc,
  doc,
  getDoc,
  onAuthStateChanged,
  onSnapshot,
  provider,
  query,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signOut,
  updateDoc,
  where,
} from "./firebase.js";

const ROLES = {
  ADMIN: "admin",
  STUDIO_CREW: "studioCrew",
  TEACHER: "teacher",
  ACCESS_DENIED: "accessDenied",
};
const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.STUDIO_CREW]: "Studio Crew",
  [ROLES.TEACHER]: "Teacher",
  [ROLES.ACCESS_DENIED]: "Access Denied",
};
const ASSIGNED_ROLES = [ROLES.ADMIN, ROLES.STUDIO_CREW];
const REQUIRED_ADMIN_EMAILS = [
  "joseph.clark@doralacademynv.org",
  "koby.walsh@doralacademynv.org",
];
const DORAL_STAFF_DOMAIN = "@doralacademynv.org";
const DORAL_STUDENT_DOMAIN = "@student.doralacademynv.org";
const ANNOUNCEMENT_STATUSES = [
  "Submitted",
  "Approved",
  "Needs Revision",
  "Ready for Broadcast",
  "Aired",
  "Skipped",
  "Archived",
  "Rejected",
];
const ITEM_STATUSES = [
  "Submitted",
  "Approved",
  "Needs Revision",
  "Ready for Broadcast",
  "Aired",
  "Skipped",
  "Archived",
];
const PROMPTER_ITEM_STATUSES = ["Approved", "Ready for Broadcast"];
const RUNDOWN_SECTIONS = [
  "Intro",
  "Main Announcements",
  "Video Clips",
  "Sports",
  "Clubs",
  "Closing",
];
const DEFAULT_CATEGORIES = [
  { id: "general", name: "General", color: "#38bdf8", type: "category" },
  { id: "academics", name: "Academics", color: "#2dd4bf", type: "category" },
  { id: "sports", name: "Sports", color: "#facc15", type: "category" },
  { id: "clubs", name: "Clubs", color: "#a78bfa", type: "category" },
  { id: "arts", name: "Arts", color: "#fb7185", type: "category" },
  { id: "counseling", name: "Counseling", color: "#60a5fa", type: "category" },
  { id: "seniors", name: "Seniors", color: "#f97316", type: "category" },
  { id: "events", name: "Events", color: "#34d399", type: "category" },
];
const DEFAULT_PRIORITIES = [
  { id: "low", name: "Low", color: "#94a3b8", type: "priority" },
  { id: "normal", name: "Normal", color: "#38bdf8", type: "priority" },
  { id: "high", name: "High", color: "#facc15", type: "priority" },
  { id: "urgent", name: "Urgent", color: "#fb7185", type: "priority" },
];

const STATUS_STYLE = {
  Submitted: "bg-sky-500/15 text-sky-200 ring-sky-400/25",
  Approved: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/25",
  "Needs Revision": "bg-amber-500/15 text-amber-200 ring-amber-400/25",
  "Ready for Broadcast": "bg-violet-500/15 text-violet-200 ring-violet-400/25",
  Aired: "bg-teal-500/15 text-teal-200 ring-teal-400/25",
  Skipped: "bg-slate-500/15 text-slate-200 ring-slate-400/25",
  Archived: "bg-zinc-500/15 text-zinc-200 ring-zinc-400/25",
  Rejected: "bg-rose-500/15 text-rose-200 ring-rose-400/25",
  Draft: "bg-sky-500/15 text-sky-200 ring-sky-400/25",
  Finalized: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/25",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function toDateLabel(value) {
  if (!value) return "No date";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );
}

function timestampLabel(value) {
  if (!value) return "Just now";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function announcementEndDate(announcement) {
  return safeText(announcement.expirationDate) || safeText(announcement.requestedAirDate);
}

function announcementRunsOnDate(announcement, date) {
  const start = safeText(announcement.requestedAirDate);
  const end = announcementEndDate(announcement);
  if (!start || !date) return false;
  return date >= start && date <= end;
}

function dateRangeLabel(announcement) {
  const start = safeText(announcement.requestedAirDate);
  const end = announcementEndDate(announcement);
  if (!start) return "No air date";
  if (!end || end === start) return toDateLabel(start);
  return `${toDateLabel(start)} to ${toDateLabel(end)}`;
}

function normalizeEmail(email) {
  return safeText(email).toLowerCase();
}

function isTeacherEmail(email) {
  return normalizeEmail(email).endsWith(DORAL_STAFF_DOMAIN);
}

function isStudentEmail(email) {
  return normalizeEmail(email).endsWith(DORAL_STUDENT_DOMAIN);
}

function isAllowedDoralEmail(email) {
  return isTeacherEmail(email) || isStudentEmail(email);
}

function isRequiredAdminEmail(email) {
  return REQUIRED_ADMIN_EMAILS.includes(normalizeEmail(email));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function roleLabel(role) {
  return ROLE_LABELS[role] || ROLE_LABELS[ROLES.ACCESS_DENIED];
}

function hasAppAccess(profile) {
  return [ROLES.ADMIN, ROLES.STUDIO_CREW, ROLES.TEACHER].includes(profile?.role);
}

function canSubmitAnnouncements(profile) {
  return hasAppAccess(profile) && isTeacherEmail(profile?.email);
}

function hasStaffAccess(profile) {
  return profile?.role === ROLES.STUDIO_CREW || profile?.role === ROLES.ADMIN;
}

function hasAdminAccess(profile) {
  return profile?.role === ROLES.ADMIN;
}

function sortByUpdated(a, b) {
  const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
  const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
  return bTime - aTime;
}

function isGoogleDriveLink(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return host === "drive.google.com" || host === "www.drive.google.com";
  } catch {
    return false;
  }
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function safeText(value) {
  return `${value || ""}`.trim();
}

function sectionForAnnouncement(announcement) {
  const category = safeText(announcement.category).toLowerCase();
  if (category.includes("sport")) return "Sports";
  if (category.includes("club")) return "Clubs";
  if (announcement.driveVideoLink) return "Video Clips";
  return "Main Announcements";
}

function buildAnnouncementScript(announcement) {
  const videoCue = announcement.driveVideoLink
    ? "\n\nVIDEO CUE: Roll the linked Google Drive clip."
    : "";
  return `${announcement.title}\n\n${announcement.text}${videoCue}`.trim();
}

function normalizeOrders(items) {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function copyText(text, label, setToast) {
  try {
    await navigator.clipboard.writeText(text);
    setToast(`${label} copied`);
  } catch {
    setToast("Copy failed. Select the text manually.");
  }
}

function Button({
  children,
  icon: Icon,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const styles = {
    primary:
      "bg-mint text-slate-950 hover:bg-teal-300 shadow-[0_0_24px_rgba(45,212,191,0.18)]",
    secondary:
      "bg-slate-800/80 text-slate-100 ring-1 ring-slate-600/60 hover:bg-slate-700/90",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800/75 ring-1 ring-slate-700/55",
    danger: "bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/30 hover:bg-rose-500/25",
    success:
      "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25",
    warn: "bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/30 hover:bg-amber-500/25",
  };

  return html`
    <button
      ...${props}
      type=${type}
      className=${classNames(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-mint/60",
        styles[variant],
        className,
      )}
    >
      ${Icon ? html`<${Icon} size=${16} strokeWidth=${2.2} />` : null}
      <span>${children}</span>
    </button>
  `;
}

function IconBadge({ icon: Icon, children, className = "" }) {
  return html`
    <span
      className=${classNames(
        "inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-300",
        className,
      )}
    >
      ${Icon ? html`<${Icon} size=${14} />` : null}
      ${children}
    </span>
  `;
}

function StatusBadge({ status }) {
  return html`
    <span
      className=${classNames(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1",
        STATUS_STYLE[status] || "bg-slate-500/15 text-slate-200 ring-slate-400/25",
      )}
    >
      ${status || "Unknown"}
    </span>
  `;
}

function Field({ label, children, hint }) {
  return html`
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        ${label}
      </span>
      ${children}
      ${hint ? html`<span className="mt-1.5 block text-xs text-slate-500">${hint}</span>` : null}
    </label>
  `;
}

function TextInput(props) {
  return html`<input ...${props} className=${classNames("field px-3 py-2.5", props.className)} />`;
}

function Textarea(props) {
  return html`
    <textarea ...${props} className=${classNames("field min-h-28 px-3 py-2.5", props.className)} />
  `;
}

function Select(props) {
  return html`<select ...${props} className=${classNames("field px-3 py-2.5", props.className)} />`;
}

function EmptyState({ icon: Icon = Sparkles, title, body }) {
  return html`
    <div className="glass-panel rounded-xl p-6 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-mint/10 text-mint">
        <${Icon} size=${22} />
      </div>
      <h3 className="text-base font-bold text-white">${title}</h3>
      ${body ? html`<p className="mt-1 text-sm text-slate-400">${body}</p>` : null}
    </div>
  `;
}

async function resolveUserRole(signedInUser) {
  const email = normalizeEmail(signedInUser?.email);
  if (!isAllowedDoralEmail(email)) return { email, role: ROLES.ACCESS_DENIED };
  if (isRequiredAdminEmail(email)) return { email, role: ROLES.ADMIN };

  const authorization = await getDoc(doc(db, "authorizedUsers", email));
  const assignedUser = authorization?.exists() ? authorization.data() : null;
  const assignedRole =
    assignedUser?.active === true &&
    assignedUser.email === email &&
    ASSIGNED_ROLES.includes(assignedUser.role) &&
    isAllowedDoralEmail(email)
      ? assignedUser.role
      : "";

  if (assignedRole) return { email, role: assignedRole };
  if (isTeacherEmail(email)) return { email, role: ROLES.TEACHER };
  return { email, role: ROLES.ACCESS_DENIED };
}

async function syncTeacherProfile(signedInUser, email) {
  const teacherRef = doc(db, "teacherProfiles", email);
  const teacherSnapshot = await getDoc(teacherRef);
  const teacherProfile = {
    email,
    displayName: signedInUser.displayName || email,
    lastLoginAt: serverTimestamp(),
  };

  if (teacherSnapshot.exists()) {
    await updateDoc(teacherRef, teacherProfile);
    return;
  }

  await setDoc(teacherRef, {
    ...teacherProfile,
    firstLoginAt: serverTimestamp(),
  });
}

function useAuthProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      setError("");
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(nextUser);
      setLoading(true);
      try {
        const resolvedRole = await resolveUserRole(nextUser);
        const nextProfile = {
          uid: nextUser.uid,
          displayName: nextUser.displayName || nextUser.email || "Teacher",
          email: resolvedRole.email,
          photoURL: nextUser.photoURL || "",
          role: resolvedRole.role,
        };

        if (resolvedRole.role === ROLES.TEACHER) {
          try {
            await syncTeacherProfile(nextUser, resolvedRole.email);
          } catch {
            // Teacher profiles are optional and should not block verified teacher access.
          }
        }

        setProfile(nextProfile);
        setLoading(false);
      } catch (authError) {
        setError(authError.message);
        setProfile({
          uid: nextUser.uid,
          displayName: nextUser.displayName || nextUser.email || "Unknown user",
          email: normalizeEmail(nextUser.email),
          photoURL: nextUser.photoURL || "",
          role: ROLES.ACCESS_DENIED,
        });
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  return { user, profile, loading, error };
}

function useTaxonomy(enabled) {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setDocs([]);
      setError("");
      return undefined;
    }
    const unsubscribe = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        setDocs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      },
      (snapshotError) => setError(snapshotError.message),
    );
    return unsubscribe;
  }, [enabled]);

  const categories = docs.filter((item) => (item.type || "category") === "category");
  const priorities = docs.filter((item) => item.type === "priority");

  return {
    categories: categories.length ? categories : DEFAULT_CATEGORIES,
    priorities: priorities.length ? priorities : DEFAULT_PRIORITIES,
    raw: docs,
    error,
  };
}

function useAnnouncements(profile) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasAppAccess(profile)) {
      setAnnouncements([]);
      setLoading(false);
      setError("");
      return undefined;
    }
    setLoading(true);
    const announcementsRef = collection(db, "announcements");
    const request = hasStaffAccess(profile)
      ? announcementsRef
      : query(announcementsRef, where("submittedByEmail", "==", profile.email));
    const unsubscribe = onSnapshot(
      request,
      (snapshot) => {
        const nextAnnouncements = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort(sortByUpdated);
        setAnnouncements(nextAnnouncements);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [profile?.email, profile?.role]);

  return { announcements, loading, error };
}

function useRundown(date) {
  const [rundown, setRundown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!date) return undefined;
    setLoading(true);
    const rundownRef = doc(db, "rundowns", date);
    const unsubscribe = onSnapshot(
      rundownRef,
      (snapshot) => {
        setRundown(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [date]);

  return { rundown, loading, error };
}

function useRundownItems(date, enabled) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !date) {
      setItems([]);
      setLoading(false);
      setError("");
      return undefined;
    }
    setLoading(true);
    const request = query(collection(db, "rundownItems"), where("rundownId", "==", date));
    const unsubscribe = onSnapshot(
      request,
      (snapshot) => {
        setItems(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
        );
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [date, enabled]);

  return { items, loading, error };
}

function useAuthorizedUsers(enabled) {
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setAuthorizedUsers([]);
      setLoading(false);
      setError("");
      return undefined;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "authorizedUsers"),
      (snapshot) => {
        setAuthorizedUsers(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .sort((a, b) => safeText(a.email).localeCompare(safeText(b.email))),
        );
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [enabled]);

  return { authorizedUsers, loading, error };
}

function useRundowns(enabled) {
  const [rundowns, setRundowns] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return undefined;
    const unsubscribe = onSnapshot(
      collection(db, "rundowns"),
      (snapshot) => {
        setRundowns(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .sort((a, b) => safeText(b.date).localeCompare(safeText(a.date))),
        );
      },
      (snapshotError) => setError(snapshotError.message),
    );
    return unsubscribe;
  }, [enabled]);

  return { rundowns, error };
}

function LoginScreen({ error }) {
  const [busy, setBusy] = useState(false);
  const signIn = async () => {
    setBusy(true);
    try {
      await signInWithPopup(auth, provider);
    } finally {
      setBusy(false);
    }
  };

  return html`
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1fr_0.85fr]">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-mint">
            <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.8)]"></span>
            Studio Control
          </div>
          <div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              Broadcast Desk
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Announcement intake, approval, and daily rundown building for a high school news studio.
            </p>
          </div>
          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            <${Metric} value="Google" label="Sign-in" icon=${Users} />
            <${Metric} value="Drive" label="Video links" icon=${Film} />
            <${Metric} value="Daily" label="Rundowns" icon=${Clapperboard} />
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5 sm:p-7">
          <div className="console-strip rounded-xl border border-slate-700/60 p-4">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                  Sign In
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">Open the queue</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950/80 text-mint ring-1 ring-mint/20">
                <${Megaphone} size=${24} />
              </div>
            </div>
            <${Button}
              icon=${LogIn}
              onClick=${signIn}
              disabled=${busy}
              className="w-full"
            >
              ${busy ? "Connecting..." : "Continue with Google"}
            </${Button}>
            ${error ? html`<p className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">${error}</p>` : null}
            <div className="mt-6 grid gap-3 text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <${Check} className="text-mint" size=${16} />
                <span>Teachers submit fast, studio teams produce cleanly.</span>
              </div>
              <div className="flex items-center gap-3">
                <${Check} className="text-mint" size=${16} />
                <span>Video files stay in Google Drive.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  `;
}

function Metric({ value, label, icon: Icon }) {
  return html`
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/55 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-mint/10 text-mint">
        <${Icon} size=${18} />
      </div>
      <p className="text-lg font-black text-white">${value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">${label}</p>
    </div>
  `;
}

function AppShell({ profile, taxonomy, children, view, setView }) {
  const role = roleLabel(profile?.role);
  const nav = [
    { id: "submit", label: "Submit", icon: Send, show: canSubmitAnnouncements(profile) },
    { id: "mine", label: "My Status", icon: ListChecks, show: canSubmitAnnouncements(profile) },
    { id: "studio", label: "Studio", icon: LayoutDashboard, show: hasStaffAccess(profile) },
    { id: "rundown", label: "Rundown", icon: Clapperboard, show: hasStaffAccess(profile) },
    { id: "teleprompter", label: "Teleprompter", icon: Maximize, show: hasStaffAccess(profile) },
    { id: "admin", label: "Admin", icon: UserCog, show: hasAdminAccess(profile) },
  ].filter((item) => item.show);

  useEffect(() => {
    if (!nav.some((item) => item.id === view)) setView(nav[0]?.id || "submit");
  }, [profile?.role, view]);

  return html`
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-ink/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-slate-950">
              <${Clapperboard} size=${21} strokeWidth=${2.4} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase tracking-[0.22em] text-white">
                Broadcast Desk
              </p>
              <p className="truncate text-xs text-slate-500">${profile?.displayName} - ${role}</p>
              <p className="hidden truncate text-[11px] text-slate-600 sm:block">${profile?.email}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            ${taxonomy.error
              ? html`<${IconBadge} icon=${X} className="text-rose-200">${taxonomy.error}</${IconBadge}>`
              : html`<${IconBadge} icon=${Sparkles}>${taxonomy.categories.length} categories</${IconBadge}>`}
            <${Button} icon=${LogOut} variant="ghost" onClick=${() => signOut(auth)}>Sign out</${Button}>
          </div>
        </div>
        <nav className="mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto pb-1 thin-scroll">
          ${nav.map(
            (item) => html`
              <button
                key=${item.id}
                type="button"
                onClick=${() => setView(item.id)}
                className=${classNames(
                  "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition",
                  view === item.id
                    ? "bg-white text-slate-950"
                    : "bg-slate-900/80 text-slate-300 ring-1 ring-slate-700/70 hover:bg-slate-800",
                )}
              >
                <${item.icon} size=${16} />
                ${item.label}
              </button>
            `,
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">${children}</main>
    </div>
  `;
}

function SubmissionForm({ profile, taxonomy, editing, onCancel, onSaved, setToast }) {
  const blank = useMemo(
    () => ({
      title: "",
      text: "",
      driveVideoLink: "",
      requestedAirDate: todayISO(),
      expirationDate: "",
      category: taxonomy.categories[0]?.name || "General",
      priority: "Normal",
      contactName: profile?.displayName || "",
      notesForStudio: "",
    }),
    [taxonomy.categories, profile?.displayName],
  );
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || "",
        text: editing.text || "",
        driveVideoLink: editing.driveVideoLink || "",
        requestedAirDate: editing.requestedAirDate || todayISO(),
        expirationDate: editing.expirationDate || "",
        category: editing.category || taxonomy.categories[0]?.name || "General",
        priority: editing.priority || "Normal",
        contactName: editing.contactName || profile?.displayName || "",
        notesForStudio: editing.notesForStudio || "",
      });
    } else {
      setForm(blank);
    }
  }, [editing?.id, blank]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!safeText(form.title) || !safeText(form.text) || !safeText(form.requestedAirDate)) {
      setError("Title, announcement text, and requested air date are required.");
      return;
    }
    if (form.expirationDate && form.expirationDate < form.requestedAirDate) {
      setError("Last air date must be on or after the first air date.");
      return;
    }
    if (!isGoogleDriveLink(form.driveVideoLink)) {
      setError("Video links must be Google Drive URLs.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        ...form,
        title: safeText(form.title),
        text: safeText(form.text),
        driveVideoLink: safeText(form.driveVideoLink),
        contactName: safeText(form.contactName),
        notesForStudio: safeText(form.notesForStudio),
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, "announcements", editing.id), {
          ...payload,
          status: "Submitted",
        });
        setToast("Submission updated");
      } else {
        const announcementRef = doc(collection(db, "announcements"));
        await setDoc(announcementRef, {
          ...payload,
          announcementId: announcementRef.id,
          submittedByEmail: normalizeEmail(profile.email),
          submittedByName: profile.displayName || profile.email || "Teacher",
          submittedByRole: profile.role,
          studioNotes: "",
          status: "Submitted",
          createdAt: serverTimestamp(),
        });
        setToast("Announcement submitted");
      }

      setForm(blank);
      onSaved?.();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return html`
    <form onSubmit=${submit} className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-mint">
            Teacher Intake
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            ${editing ? "Edit Announcement" : "New Announcement"}
          </h2>
        </div>
        ${editing
          ? html`<${Button} icon=${X} variant="ghost" onClick=${onCancel}>Cancel edit</${Button}>`
          : null}
      </div>

      ${error ? html`<p className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">${error}</p>` : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <${Field} label="Title">
          <${TextInput}
            value=${form.title}
            maxLength=${90}
            onInput=${(event) => update("title", event.currentTarget.value)}
            placeholder="Senior night parking update"
          />
        </${Field}>
        <${Field} label="Google Drive video link" hint="Optional. Paste a Drive link only.">
          <${TextInput}
            value=${form.driveVideoLink}
            onInput=${(event) => update("driveVideoLink", event.currentTarget.value)}
            placeholder="https://drive.google.com/file/d/..."
          />
        </${Field}>
        <${Field} label="Announcement text">
          <${Textarea}
            value=${form.text}
            onInput=${(event) => update("text", event.currentTarget.value)}
            placeholder="Write the exact message anchors should read."
            className="lg:min-h-40"
          />
        </${Field}>
        <div className="grid gap-4 sm:grid-cols-2">
          <${Field} label="First air date">
            <${TextInput}
              type="date"
              value=${form.requestedAirDate}
              onInput=${(event) => update("requestedAirDate", event.currentTarget.value)}
            />
          </${Field}>
          <${Field} label="Last air date">
            <${TextInput}
              type="date"
              value=${form.expirationDate}
              onInput=${(event) => update("expirationDate", event.currentTarget.value)}
            />
          </${Field}>
          <${Field} label="Category">
            <${Select}
              value=${form.category}
              onChange=${(event) => update("category", event.currentTarget.value)}
            >
              ${taxonomy.categories.map(
                (category) => html`<option key=${category.id} value=${category.name}>${category.name}</option>`,
              )}
            </${Select}>
          </${Field}>
          <${Field} label="Priority">
            <${Select}
              value=${form.priority}
              onChange=${(event) => update("priority", event.currentTarget.value)}
            >
              ${taxonomy.priorities.map(
                (priority) => html`<option key=${priority.id} value=${priority.name}>${priority.name}</option>`,
              )}
            </${Select}>
          </${Field}>
          <${Field} label="Contact name">
            <${TextInput}
              value=${form.contactName}
              onInput=${(event) => update("contactName", event.currentTarget.value)}
              placeholder="Teacher or sponsor name"
            />
          </${Field}>
          <${Field} label="Studio notes">
            <${Textarea}
              value=${form.notesForStudio}
              onInput=${(event) => update("notesForStudio", event.currentTarget.value)}
              placeholder="Pronunciation, timing, deadline, or context."
              className="min-h-24"
            />
          </${Field}>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <${Button} icon=${Send} type="submit" disabled=${busy}>
          ${busy ? "Saving..." : editing ? "Resubmit" : "Submit announcement"}
        </${Button}>
      </div>
    </form>
  `;
}

function TeacherStatus({ profile, taxonomy, setToast }) {
  const { announcements, loading, error } = useAnnouncements(profile);
  const [editing, setEditing] = useState(null);
  const visible = announcements.filter((item) => !item.deletedAt);

  if (editing) {
    return html`
      <${SubmissionForm}
        profile=${profile}
        taxonomy=${taxonomy}
        editing=${editing}
        setToast=${setToast}
        onCancel=${() => setEditing(null)}
        onSaved=${() => setEditing(null)}
      />
    `;
  }

  return html`
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-mint">My Queue</p>
          <h2 className="mt-1 text-2xl font-black text-white">Submission Status</h2>
        </div>
        <${IconBadge} icon=${ListChecks}>${visible.length} active</${IconBadge}>
      </div>
      ${error ? html`<p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">${error}</p>` : null}
      ${loading
        ? html`<${EmptyState} icon=${RefreshCcw} title="Loading submissions" />`
        : visible.length === 0
          ? html`<${EmptyState} title="No announcements yet" body="Submitted announcements will show here." />`
          : html`
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                ${visible.map(
                  (announcement) => html`
                    <article key=${announcement.id} className="glass-panel rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black text-white">${announcement.title}</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            ${dateRangeLabel(announcement)} - ${announcement.category}
                          </p>
                        </div>
                        <${StatusBadge} status=${announcement.status} />
                      </div>
                      <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-300">${announcement.text}</p>
                      ${announcement.studioNotes
                        ? html`
                            <div className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100">
                              ${announcement.studioNotes}
                            </div>
                          `
                        : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <${IconBadge} icon=${CalendarDays}>Runs ${dateRangeLabel(announcement)}</${IconBadge}>
                        <${IconBadge} icon=${Sparkles}>${announcement.priority}</${IconBadge}>
                      </div>
                      ${["Submitted", "Needs Revision"].includes(announcement.status)
                        ? html`
                            <${Button}
                              icon=${Pencil}
                              variant="secondary"
                              className="mt-4 w-full"
                              onClick=${() => setEditing(announcement)}
                            >
                              Edit
                            </${Button}>
                          `
                        : null}
                    </article>
                  `,
                )}
              </div>
            `}
    </section>
  `;
}

function StudioDashboard({ profile, setToast }) {
  const { announcements, loading, error } = useAnnouncements(profile);
  const [filters, setFilters] = useState({
    date: "",
    category: "",
    priority: "",
    teacher: "",
    status: "",
  });

  const activeAnnouncements = announcements.filter((item) => !item.deletedAt);
  const filterOptions = useMemo(() => {
    const unique = (field) =>
      [...new Set(activeAnnouncements.map((item) => safeText(item[field])).filter(Boolean))].sort();
    return {
      categories: unique("category"),
      priorities: unique("priority"),
      teachers: unique("submittedByName"),
    };
  }, [activeAnnouncements]);

  const filtered = activeAnnouncements.filter((item) => {
    return (
      (!filters.date || announcementRunsOnDate(item, filters.date)) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.priority || item.priority === filters.priority) &&
      (!filters.teacher || item.submittedByName === filters.teacher) &&
      (!filters.status || item.status === filters.status)
    );
  });

  const updateStatus = async (announcement, status) => {
    await updateDoc(doc(db, "announcements", announcement.id), {
      status,
      updatedAt: serverTimestamp(),
    });
    setToast(`${announcement.title} marked ${status}`);
  };

  const statusCounts = ANNOUNCEMENT_STATUSES.map((status) => ({
    status,
    count: activeAnnouncements.filter((item) => item.status === status).length,
  })).filter((item) => item.count > 0);

  return html`
    <section className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-mint">Production Board</p>
          <h2 className="mt-1 text-2xl font-black text-white">Studio Approval Dashboard</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          ${statusCounts.map(
            (item) => html`<${StatusBadge} key=${item.status} status=${`${item.status}: ${item.count}`} />`,
          )}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
          <${Filter} size=${16} />
          Filters
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <${TextInput}
            type="date"
            value=${filters.date}
            onInput=${(event) => setFilters({ ...filters, date: event.currentTarget.value })}
          />
          <${FilterSelect}
            value=${filters.category}
            placeholder="All categories"
            options=${filterOptions.categories}
            onChange=${(value) => setFilters({ ...filters, category: value })}
          />
          <${FilterSelect}
            value=${filters.priority}
            placeholder="All priorities"
            options=${filterOptions.priorities}
            onChange=${(value) => setFilters({ ...filters, priority: value })}
          />
          <${FilterSelect}
            value=${filters.teacher}
            placeholder="All teachers"
            options=${filterOptions.teachers}
            onChange=${(value) => setFilters({ ...filters, teacher: value })}
          />
          <${FilterSelect}
            value=${filters.status}
            placeholder="All statuses"
            options=${ANNOUNCEMENT_STATUSES}
            onChange=${(value) => setFilters({ ...filters, status: value })}
          />
        </div>
      </div>

      ${error ? html`<p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">${error}</p>` : null}
      ${loading
        ? html`<${EmptyState} icon=${RefreshCcw} title="Loading board" />`
        : filtered.length === 0
          ? html`<${EmptyState} icon=${LayoutDashboard} title="No matching announcements" />`
          : html`
              <div className="grid gap-4 lg:hidden">
                ${filtered.map(
                  (announcement) => html`
                    <${AnnouncementCard}
                      key=${announcement.id}
                      announcement=${announcement}
                      updateStatus=${updateStatus}
                      setToast=${setToast}
                    />
                  `,
                )}
              </div>
              <div className="glass-panel hidden overflow-hidden rounded-xl lg:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="border-b border-slate-800 bg-slate-950/55 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Announcement</th>
                      <th className="px-4 py-3">Air Date</th>
                      <th className="px-4 py-3">Teacher</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Production</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filtered.map(
                      (announcement) => html`
                        <tr key=${announcement.id} className="border-b border-slate-800/70 align-top">
                          <td className="max-w-md px-4 py-4">
                            <p className="font-black text-white">${announcement.title}</p>
                            <p className="mt-1 line-clamp-2 text-slate-400">${announcement.text}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <${IconBadge}>${announcement.category}</${IconBadge}>
                              <${IconBadge}>${announcement.priority}</${IconBadge}>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-300">${dateRangeLabel(announcement)}</td>
                          <td className="px-4 py-4 text-slate-300">${announcement.submittedByName}</td>
                          <td className="px-4 py-4"><${StatusBadge} status=${announcement.status} /></td>
                          <td className="w-72 px-4 py-4">
                            <${ProductionNotes} announcement=${announcement} setToast=${setToast} />
                          </td>
                          <td className="px-4 py-4">
                            <${AnnouncementActions}
                              announcement=${announcement}
                              updateStatus=${updateStatus}
                              setToast=${setToast}
                            />
                          </td>
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </div>
            `}
    </section>
  `;
}

function FilterSelect({ value, placeholder, options, onChange }) {
  return html`
    <${Select} value=${value} onChange=${(event) => onChange(event.currentTarget.value)}>
      <option value="">${placeholder}</option>
      ${options.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
    </${Select}>
  `;
}

function AnnouncementCard({ announcement, updateStatus, setToast }) {
  return html`
    <article className="glass-panel rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">${announcement.title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            ${dateRangeLabel(announcement)} - ${announcement.submittedByName}
          </p>
        </div>
        <${StatusBadge} status=${announcement.status} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">${announcement.text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <${IconBadge}>${announcement.category}</${IconBadge}>
        <${IconBadge}>${announcement.priority}</${IconBadge}>
      </div>
      <div className="mt-4">
        <${ProductionNotes} announcement=${announcement} setToast=${setToast} />
      </div>
      <div className="mt-4">
        <${AnnouncementActions}
          announcement=${announcement}
          updateStatus=${updateStatus}
          setToast=${setToast}
        />
      </div>
    </article>
  `;
}

function ProductionNotes({ announcement, setToast }) {
  const [draft, setDraft] = useState(announcement.studioNotes || "");

  useEffect(() => setDraft(announcement.studioNotes || ""), [announcement.id, announcement.studioNotes]);

  const save = async () => {
    await updateDoc(doc(db, "announcements", announcement.id), {
      studioNotes: draft,
      updatedAt: serverTimestamp(),
    });
    setToast("Production note saved");
  };

  return html`
    <div className="space-y-2">
      <${Textarea}
        value=${draft}
        onInput=${(event) => setDraft(event.currentTarget.value)}
        placeholder="Internal production notes"
        className="min-h-20 text-sm"
      />
      <${Button} icon=${Save} variant="ghost" className="w-full" onClick=${save}>Save note</${Button}>
    </div>
  `;
}

function AnnouncementActions({ announcement, updateStatus, setToast }) {
  return html`
    <div className="flex flex-wrap gap-2">
      <${Button} icon=${Check} variant="success" onClick=${() => updateStatus(announcement, "Approved")}>Approve</${Button}>
      <${Button} icon=${Sparkles} variant="secondary" onClick=${() => updateStatus(announcement, "Ready for Broadcast")}>Ready</${Button}>
      <${Button} icon=${RefreshCcw} variant="warn" onClick=${() => updateStatus(announcement, "Needs Revision")}>Revise</${Button}>
      <${Button} icon=${X} variant="danger" onClick=${() => updateStatus(announcement, "Rejected")}>Reject</${Button}>
      <${Button} icon=${Archive} variant="ghost" onClick=${() => updateStatus(announcement, "Archived")}>Archive</${Button}>
      ${announcement.driveVideoLink
        ? html`
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-100 ring-1 ring-slate-600/60 transition hover:bg-slate-700"
              href=${announcement.driveVideoLink}
              target="_blank"
              rel="noreferrer"
            >
              <${ExternalLink} size=${16} />
              Drive
            </a>
          `
        : null}
      <${Button}
        icon=${Clipboard}
        variant="ghost"
        onClick=${() => copyText(buildAnnouncementScript(announcement), "Anchor script", setToast)}
      >
        Copy script
      </${Button}>
    </div>
  `;
}

function RundownBuilder({ profile, setToast }) {
  const [date, setDate] = useState(todayISO());
  const [custom, setCustom] = useState({ title: "", scriptText: "", section: "Main Announcements" });
  const [dragging, setDragging] = useState(null);
  const { announcements } = useAnnouncements(profile);
  const { rundown, loading, error } = useRundown(date);
  const locked = Boolean(rundown?.locked);
  const items = useMemo(() => normalizeOrders(rundown?.items || []), [rundown?.items]);
  const approvedForDate = announcements.filter(
    (item) =>
      !item.deletedAt &&
      announcementRunsOnDate(item, date) &&
      ["Approved", "Ready for Broadcast"].includes(item.status),
  );
  const missingApproved = approvedForDate.filter(
    (announcement) => !items.some((item) => item.announcementId === announcement.id),
  );

  const rundownRef = doc(db, "rundowns", date);

  const saveRundown = async (nextItems, extra = {}) => {
    if (locked && !hasAdminAccess(profile)) {
      setToast("This rundown is locked");
      return;
    }
    await setDoc(
      rundownRef,
      {
        rundownId: date,
        date,
        status: rundown?.status || "Draft",
        locked: rundown?.locked || false,
        items: normalizeOrders(nextItems),
        createdBy: rundown?.createdBy || profile.uid,
        updatedAt: serverTimestamp(),
        ...extra,
      },
      { merge: true },
    );
  };

  const importApproved = async () => {
    const newItems = missingApproved.map((announcement, index) => ({
      itemId: `${announcement.id}-${Date.now()}-${index}`,
      announcementId: announcement.id,
      title: announcement.title,
      scriptText: buildAnnouncementScript(announcement),
      driveVideoLink: announcement.driveVideoLink || "",
      category: announcement.category,
      section: sectionForAnnouncement(announcement),
      order: items.length + index + 1,
      status: announcement.status,
      productionNotes: announcement.studioNotes || "",
    }));
    await saveRundown([...items, ...newItems]);
    setToast(`${newItems.length} approved item${newItems.length === 1 ? "" : "s"} added`);
  };

  const addCustom = async (event) => {
    event.preventDefault();
    if (!safeText(custom.title) || !safeText(custom.scriptText)) return;
    await saveRundown([
      ...items,
      {
        itemId: `custom-${Date.now()}`,
        announcementId: "",
        title: safeText(custom.title),
        scriptText: safeText(custom.scriptText),
        driveVideoLink: "",
        category: "Script",
        section: custom.section,
        order: items.length + 1,
        status: "Submitted",
        productionNotes: "",
      },
    ]);
    setCustom({ title: "", scriptText: "", section: "Main Announcements" });
    setToast("Script-only item added");
  };

  const updateItem = async (itemId, patch) => {
    await saveRundown(items.map((item) => (item.itemId === itemId ? { ...item, ...patch } : item)));
  };

  const removeItem = async (itemId) => {
    await saveRundown(items.filter((item) => item.itemId !== itemId));
    setToast("Rundown item removed");
  };

  const handleDrop = async (targetSection, targetItemId = "") => {
    if (!dragging || locked) return;
    const moving = items.find((item) => item.itemId === dragging.itemId);
    if (!moving) return;
    const remaining = items.filter((item) => item.itemId !== dragging.itemId);
    const updatedMoving = { ...moving, section: targetSection };
    const targetIndex = targetItemId
      ? remaining.findIndex((item) => item.itemId === targetItemId)
      : -1;
    const nextItems =
      targetIndex >= 0
        ? [
            ...remaining.slice(0, targetIndex),
            updatedMoving,
            ...remaining.slice(targetIndex),
          ]
        : [...remaining, updatedMoving];
    await saveRundown(nextItems);
    setDragging(null);
  };

  const toggleLock = async () => {
    if (!hasAdminAccess(profile)) return;
    await setDoc(
      rundownRef,
      {
        rundownId: date,
        date,
        status: locked ? "Draft" : "Finalized",
        locked: !locked,
        items,
        createdBy: rundown?.createdBy || profile.uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    setToast(locked ? "Rundown unlocked" : "Rundown locked");
  };

  const anchorScript = buildRundownScript({ date, items });
  const printable = buildPrintableRundown({ date, items, status: rundown?.status || "Draft" });

  return html`
    <section className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-mint">Daily Rundown</p>
          <h2 className="mt-1 text-2xl font-black text-white">${toDateLabel(date)}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <${TextInput}
            type="date"
            value=${date}
            className="w-auto"
            onInput=${(event) => setDate(event.currentTarget.value)}
          />
          <${StatusBadge} status=${rundown?.status || "Draft"} />
          ${locked ? html`<${IconBadge} icon=${Lock} className="text-amber-200">Locked</${IconBadge}>` : null}
          ${hasAdminAccess(profile)
            ? html`
                <${Button} icon=${locked ? Unlock : Lock} variant="secondary" onClick=${toggleLock}>
                  ${locked ? "Unlock" : "Lock"}
                </${Button}>
              `
            : null}
        </div>
      </div>

      ${error ? html`<p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">${error}</p>` : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-black text-white">Approved for this date</h3>
                <p className="text-sm text-slate-400">${missingApproved.length} not in rundown</p>
              </div>
              <${Button}
                icon=${Plus}
                variant="primary"
                disabled=${locked || missingApproved.length === 0}
                onClick=${importApproved}
              >
                Add approved
              </${Button}>
            </div>
          </div>

          ${loading
            ? html`<${EmptyState} icon=${RefreshCcw} title="Loading rundown" />`
            : html`
                <div className="grid gap-4 2xl:grid-cols-2">
                  ${RUNDOWN_SECTIONS.map((section) => {
                    const sectionItems = items.filter((item) => item.section === section);
                    return html`
                      <div
                        key=${section}
                        className="glass-panel min-h-44 rounded-xl p-4"
                        onDragOver=${(event) => event.preventDefault()}
                        onDrop=${() => handleDrop(section)}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-black text-white">${section}</h3>
                          <span className="text-xs font-bold text-slate-500">${sectionItems.length}</span>
                        </div>
                        <div className="space-y-3">
                          ${sectionItems.length === 0
                            ? html`<p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">Drop items here</p>`
                            : sectionItems.map(
                                (item) => html`
                                  <${RundownItem}
                                    key=${item.itemId}
                                    item=${item}
                                    locked=${locked}
                                    setDragging=${setDragging}
                                    onDropItem=${handleDrop}
                                    updateItem=${updateItem}
                                    removeItem=${removeItem}
                                    setToast=${setToast}
                                  />
                                `,
                              )}
                        </div>
                      </div>
                    `;
                  })}
                </div>
              `}
        </div>

        <aside className="space-y-4">
          <form onSubmit=${addCustom} className="glass-panel rounded-xl p-4">
            <h3 className="mb-3 font-black text-white">Script-only item</h3>
            <div className="space-y-3">
              <${TextInput}
                value=${custom.title}
                onInput=${(event) => setCustom({ ...custom, title: event.currentTarget.value })}
                placeholder="Anchor intro"
                disabled=${locked}
              />
              <${Select}
                value=${custom.section}
                onChange=${(event) => setCustom({ ...custom, section: event.currentTarget.value })}
                disabled=${locked}
              >
                ${RUNDOWN_SECTIONS.map(
                  (section) => html`<option key=${section} value=${section}>${section}</option>`,
                )}
              </${Select}>
              <${Textarea}
                value=${custom.scriptText}
                onInput=${(event) => setCustom({ ...custom, scriptText: event.currentTarget.value })}
                placeholder="Script text"
                disabled=${locked}
              />
              <${Button} icon=${Plus} type="submit" disabled=${locked} className="w-full">Add item</${Button}>
            </div>
          </form>

          <${ScriptPanel}
            title="Anchor Script"
            text=${anchorScript}
            copyLabel="Anchor script"
            setToast=${setToast}
          />
          <${ScriptPanel}
            title="Printable Rundown"
            text=${printable}
            copyLabel="Printable rundown"
            setToast=${setToast}
          />
        </aside>
      </div>
    </section>
  `;
}

function RundownItem({ item, locked, setDragging, onDropItem, updateItem, removeItem, setToast }) {
  const [notes, setNotes] = useState(item.productionNotes || "");

  useEffect(() => setNotes(item.productionNotes || ""), [item.itemId, item.productionNotes]);

  return html`
    <article
      draggable=${!locked}
      onDragStart=${() => setDragging({ itemId: item.itemId })}
      onDragOver=${(event) => event.preventDefault()}
      onDrop=${(event) => {
        event.stopPropagation();
        onDropItem(item.section, item.itemId);
      }}
      className=${classNames(
        "rounded-lg border border-slate-700/70 bg-slate-950/62 p-3 transition",
        locked ? "" : "hover:border-mint/45",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-slate-500">
          <${GripVertical} size=${18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-black text-white">${item.order}. ${item.title}</h4>
            <${StatusBadge} status=${item.status} />
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">${item.scriptText}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <${Select}
              value=${item.status}
              disabled=${locked}
              onChange=${(event) => updateItem(item.itemId, { status: event.currentTarget.value })}
            >
              ${ITEM_STATUSES.map((status) => html`<option key=${status} value=${status}>${status}</option>`)}
            </${Select}>
            <${Select}
              value=${item.section}
              disabled=${locked}
              onChange=${(event) => updateItem(item.itemId, { section: event.currentTarget.value })}
            >
              ${RUNDOWN_SECTIONS.map(
                (section) => html`<option key=${section} value=${section}>${section}</option>`,
              )}
            </${Select}>
          </div>
          <div className="mt-3 grid gap-2">
            <${Textarea}
              value=${notes}
              disabled=${locked}
              onInput=${(event) => setNotes(event.currentTarget.value)}
              placeholder="Production notes"
              className="min-h-20 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <${Button}
                icon=${Save}
                variant="ghost"
                disabled=${locked}
                onClick=${() => updateItem(item.itemId, { productionNotes: notes })}
              >
                Save
              </${Button}>
              ${item.driveVideoLink
                ? html`
                    <a
                      href=${item.driveVideoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-100 ring-1 ring-slate-600/60 transition hover:bg-slate-700"
                    >
                      <${ExternalLink} size=${16} />
                      Drive
                    </a>
                  `
                : null}
              <${Button}
                icon=${Clipboard}
                variant="ghost"
                onClick=${() => copyText(item.scriptText, "Item script", setToast)}
              >
                Copy
              </${Button}>
              <${Button}
                icon=${Trash2}
                variant="danger"
                disabled=${locked}
                onClick=${() => removeItem(item.itemId)}
              >
                Remove
              </${Button}>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function buildRundownScript({ date, items }) {
  const lines = [`ANCHOR SCRIPT - ${toDateLabel(date)}`, ""];
  RUNDOWN_SECTIONS.forEach((section) => {
    const activeItems = items
      .filter((item) => item.section === section)
      .filter((item) => !["Skipped", "Archived"].includes(item.status));
    if (!activeItems.length) return;
    lines.push(section.toUpperCase());
    activeItems.forEach((item) => {
      lines.push("", item.scriptText);
    });
    lines.push("");
  });
  return lines.join("\n").trim();
}

function teleprompterSourceItems(rundown, rundownItems) {
  const source = rundownItems.length ? rundownItems : rundown?.items || [];
  return normalizeOrders(
    source
      .map((item, index) => ({
        itemId: item.itemId || item.id || `teleprompter-${index}`,
        title: safeText(item.title) || `Segment ${index + 1}`,
        scriptText: safeText(item.scriptText || item.text || item.script),
        section: safeText(item.section) || "Main Announcements",
        status: item.status || "Submitted",
        order: Number(item.order) || index + 1,
      }))
      .filter((item) => PROMPTER_ITEM_STATUSES.includes(item.status))
      .filter((item) => safeText(item.scriptText)),
  );
}

function buildTeleprompterSegments(items) {
  const extraSections = [
    ...new Set(
      items
        .map((item) => item.section)
        .filter((section) => section && !RUNDOWN_SECTIONS.includes(section)),
    ),
  ];
  return [...RUNDOWN_SECTIONS, ...extraSections]
    .map((section) => ({
      section,
      items: items.filter((item) => item.section === section).sort((a, b) => a.order - b.order),
    }))
    .filter((segment) => segment.items.length > 0);
}

function TeleprompterMode({ profile }) {
  const [date, setDate] = useState(todayISO());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(42);
  const [fontSize, setFontSize] = useState(58);
  const [theme, setTheme] = useState("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef(null);
  const scrollRef = useRef(null);
  const { rundown, loading, error } = useRundown(date);
  const {
    items: rundownItems,
    loading: rundownItemsLoading,
    error: rundownItemsError,
  } = useRundownItems(date, hasStaffAccess(profile));
  const finalRundown = Boolean(rundown?.locked || rundown?.status === "Finalized");
  const teleprompterItems = useMemo(
    () => (finalRundown ? teleprompterSourceItems(rundown, rundownItems) : []),
    [finalRundown, rundown?.items, rundownItems],
  );
  const segments = useMemo(() => buildTeleprompterSegments(teleprompterItems), [teleprompterItems]);
  const hasScript = segments.length > 0;
  const lightMode = theme === "light";

  const updateSpeed = (delta) => setSpeed((current) => clamp(current + delta, 0, 180));
  const updateFontSize = (delta) => setFontSize((current) => clamp(current + delta, 32, 110));

  const restart = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await stageRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!playing || !hasScript) return undefined;
    let frameId = 0;
    let lastTime = performance.now();

    const tick = (time) => {
      const scroller = scrollRef.current;
      if (!scroller) return;
      const elapsed = Math.min(time - lastTime, 120);
      lastTime = time;
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      scroller.scrollTop = Math.min(maxScroll, scroller.scrollTop + (speed * elapsed) / 1000);
      if (scroller.scrollTop >= maxScroll - 1) {
        setPlaying(false);
        return;
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [playing, speed, hasScript]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName;
      const editingField = ["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
      if (editingField && event.key !== "Escape") return;

      if (event.key === " ") {
        event.preventDefault();
        if (hasScript) setPlaying((current) => !current);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        updateSpeed(-6);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        updateSpeed(6);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        updateFontSize(4);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        updateFontSize(-4);
      } else if (event.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasScript]);

  useEffect(() => {
    setPlaying(false);
    restart();
  }, [date, finalRundown]);

  const surfaceClasses = lightMode
    ? "border-slate-200 bg-slate-50 text-slate-950"
    : "border-slate-800 bg-black text-white";
  const controlClasses = lightMode
    ? "border-slate-300 bg-white/92 text-slate-950 shadow-xl"
    : "border-slate-700 bg-slate-950/88 text-white shadow-glow";
  const subtleButtonVariant = lightMode ? "secondary" : "ghost";
  const loadingScript = loading || rundownItemsLoading;
  const hasEmbeddedItems = Boolean((rundown?.items || []).length);
  const combinedError = error || (!hasEmbeddedItems ? rundownItemsError : "");

  return html`
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-mint">Teleprompter Mode</p>
          <h2 className="mt-1 text-2xl font-black text-white">${toDateLabel(date)}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          ${finalRundown
            ? html`<${IconBadge} icon=${Lock} className="text-emerald-200">Final Rundown</${IconBadge}>`
            : html`<${StatusBadge} status=${rundown?.status || "No Rundown"} />`}
          <${IconBadge} icon=${CalendarDays}>${teleprompterItems.length} anchor items</${IconBadge}>
        </div>
      </div>

      <div
        ref=${stageRef}
        className=${classNames(
          "teleprompter-stage relative min-h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border",
          surfaceClasses,
        )}
      >
        <div
          className=${classNames(
            "absolute left-3 right-3 top-3 z-20 rounded-xl border p-3 transition-opacity duration-500 sm:left-5 sm:right-5 sm:top-5",
            controlClasses,
            playing ? "opacity-25 hover:opacity-100 focus-within:opacity-100" : "opacity-100",
          )}
        >
          <div className="grid gap-3 lg:grid-cols-[auto_1fr_1fr_auto] lg:items-center">
            <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:items-center">
              <input
                type="date"
                value=${date}
                onInput=${(event) => setDate(event.currentTarget.value)}
                className=${classNames(
                  "min-h-10 rounded-lg border px-3 py-2 text-sm font-bold outline-none",
                  lightMode ? "border-slate-300 bg-white text-slate-950" : "border-slate-700 bg-slate-950 text-white",
                )}
              />
              <${Button}
                icon=${playing ? Pause : Play}
                disabled=${!hasScript}
                onClick=${() => setPlaying((current) => !current)}
              >
                ${playing ? "Pause" : "Play"}
              </${Button}>
            </div>

            <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <${Button} icon=${Minus} variant=${subtleButtonVariant} onClick=${() => updateSpeed(-6)}>Speed</${Button}>
              <input
                type="range"
                min="0"
                max="180"
                value=${speed}
                onInput=${(event) => setSpeed(Number(event.currentTarget.value))}
                className="w-full accent-teal-300"
                aria-label="Scroll speed"
              />
              <${Button} icon=${Plus} variant=${subtleButtonVariant} onClick=${() => updateSpeed(6)}>${speed}</${Button}>
            </div>

            <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <${Button} icon=${Minus} variant=${subtleButtonVariant} onClick=${() => updateFontSize(-4)}>Text</${Button}>
              <input
                type="range"
                min="32"
                max="110"
                value=${fontSize}
                onInput=${(event) => setFontSize(Number(event.currentTarget.value))}
                className="w-full accent-teal-300"
                aria-label="Font size"
              />
              <${Button} icon=${Plus} variant=${subtleButtonVariant} onClick=${() => updateFontSize(4)}>${fontSize}</${Button}>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <${Button} icon=${Rewind} variant=${subtleButtonVariant} onClick=${restart}>Top</${Button}>
              <${Button}
                icon=${lightMode ? Moon : Sun}
                variant=${subtleButtonVariant}
                onClick=${() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              >
                ${lightMode ? "Dark" : "Light"}
              </${Button}>
              <${Button} icon=${Maximize} variant="secondary" onClick=${toggleFullscreen}>
                ${isFullscreen ? "Exit" : "Full"}
              </${Button}>
            </div>
          </div>
        </div>

        <div
          ref=${scrollRef}
          className="prompter-scroll h-[calc(100vh-10rem)] overflow-y-auto scroll-smooth px-5 pb-40 pt-44 thin-scroll sm:px-10 sm:pt-36 lg:px-16"
        >
          <div className="mx-auto max-w-6xl">
            ${combinedError
              ? html`<div className="rounded-xl bg-rose-500/10 p-5 text-xl text-rose-200">${combinedError}</div>`
              : loadingScript
                ? html`<div className="pt-24 text-center text-3xl font-black">Loading script...</div>`
                : !rundown
                  ? html`<div className="pt-24 text-center text-3xl font-black">No rundown for this date.</div>`
                  : !finalRundown
                    ? html`<div className="pt-24 text-center text-3xl font-black">Rundown is not finalized yet.</div>`
                    : !hasScript
                      ? html`<div className="pt-24 text-center text-3xl font-black">No approved or ready anchor items.</div>`
                      : html`
                          <article
                            className=${classNames("pb-[45vh]", lightMode ? "text-slate-950" : "text-white")}
                            style=${{ fontSize: `${fontSize}px`, lineHeight: 1.42 }}
                          >
                            <header className="mb-16 border-b pb-8 ${lightMode ? "border-slate-300" : "border-slate-700"}">
                              <p className="text-[0.32em] font-black uppercase tracking-[0.22em] text-teal-400">
                                Broadcast Desk
                              </p>
                              <h1 className="mt-3 text-[0.78em] font-black leading-tight">
                                ${toDateLabel(date)}
                              </h1>
                            </header>

                            ${segments.map(
                              (segment) => html`
                                <section key=${segment.section} className="mb-20">
                                  <h2 className="mb-8 rounded-lg border-l-4 border-teal-300 pl-5 text-[0.46em] font-black uppercase tracking-[0.12em] text-teal-300">
                                    ${segment.section}
                                  </h2>
                                  <div className="space-y-14">
                                    ${segment.items.map(
                                      (item) => html`
                                        <div key=${item.itemId} className="space-y-5">
                                          <h3 className=${classNames("text-[0.42em] font-black uppercase tracking-[0.08em]", lightMode ? "text-slate-500" : "text-slate-400")}>
                                            ${item.title}
                                          </h3>
                                          <p className="whitespace-pre-wrap">${item.scriptText}</p>
                                        </div>
                                      `,
                                    )}
                                  </div>
                                </section>
                              `,
                            )}
                          </article>
                        `}
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildPrintableRundown({ date, items, status }) {
  const lines = [`BROADCAST RUNDOWN - ${toDateLabel(date)}`, `STATUS: ${status}`, ""];
  RUNDOWN_SECTIONS.forEach((section) => {
    const sectionItems = items.filter((item) => item.section === section);
    lines.push(section.toUpperCase());
    if (!sectionItems.length) {
      lines.push("  --");
      return;
    }
    sectionItems.forEach((item) => {
      lines.push(
        `  ${item.order}. ${item.title} [${item.status}]`,
        `     Notes: ${item.productionNotes || "--"}`,
        item.driveVideoLink ? `     Video: ${item.driveVideoLink}` : "",
      );
    });
    lines.push("");
  });
  return lines.filter((line) => line !== "").join("\n");
}

function ScriptPanel({ title, text, copyLabel, setToast }) {
  return html`
    <div className="glass-panel rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-black text-white">${title}</h3>
        <${Button}
          icon=${Clipboard}
          variant="ghost"
          onClick=${() => copyText(text, copyLabel, setToast)}
        >
          Copy
        </${Button}>
      </div>
      <pre className="print-sheet max-h-80 overflow-auto rounded-lg bg-slate-950/75 p-3 text-xs leading-5 text-slate-300 thin-scroll">${text || "No rundown items yet."}</pre>
    </div>
  `;
}

async function saveAuthorizedUser(email, role, profile) {
  const authorizationRef = doc(db, "authorizedUsers", email);
  const authorization = await getDoc(authorizationRef);

  if (authorization.exists()) {
    await updateDoc(authorizationRef, {
      role,
      active: true,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(authorizationRef, {
    email,
    role,
    active: true,
    createdAt: serverTimestamp(),
    createdBy: normalizeEmail(profile.email),
    updatedAt: serverTimestamp(),
  });
}

function AuthorizedUserForm({ role, profile, setToast }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const label = roleLabel(role);

  const submit = async (event) => {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    setError("");

    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!isAllowedDoralEmail(normalizedEmail)) {
      setError("Use a Doral staff or student email address.");
      return;
    }

    setBusy(true);
    try {
      await saveAuthorizedUser(normalizedEmail, role, profile);
      setEmail("");
      setToast(`${normalizedEmail} assigned as ${label}`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  return html`
    <form onSubmit=${submit} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/45 p-3">
      <div>
        <p className="font-black text-white">Add ${label}</p>
        <p className="text-sm text-slate-500">Assign access by exact email.</p>
      </div>
      <${TextInput}
        value=${email}
        type="email"
        onInput=${(event) => setEmail(event.currentTarget.value)}
        placeholder=${role === ROLES.STUDIO_CREW ? "student@student.doralacademynv.org" : "admin@doralacademynv.org"}
        autoCapitalize="none"
        autoComplete="email"
        spellCheck=${false}
      />
      ${error ? html`<p className="rounded-lg bg-rose-500/10 p-2 text-sm text-rose-200">${error}</p>` : null}
      <${Button} icon=${Plus} type="submit" disabled=${busy}>
        ${busy ? "Saving..." : `Add ${label}`}
      </${Button}>
    </form>
  `;
}

function AuthorizedUserList({ title, role, users, loading, setToast }) {
  const [busyEmail, setBusyEmail] = useState("");
  const [error, setError] = useState("");
  const requiredAdmins =
    role === ROLES.ADMIN
      ? REQUIRED_ADMIN_EMAILS.map((email) => ({
          id: `required-${email}`,
          email,
          role,
          active: true,
          required: true,
        }))
      : [];
  const activeUsers = [
    ...requiredAdmins,
    ...users.filter(
      (user) =>
        user.active === true &&
        user.role === role &&
        !requiredAdmins.some((requiredAdmin) => requiredAdmin.email === user.email),
    ),
  ];

  const remove = async (user) => {
    setBusyEmail(user.email);
    setError("");
    try {
      await updateDoc(doc(db, "authorizedUsers", user.id), {
        active: false,
        updatedAt: serverTimestamp(),
      });
      setToast(`${user.email} removed from ${roleLabel(role)}`);
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setBusyEmail("");
    }
  };

  return html`
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/45">
      <div className="border-b border-slate-800 p-3">
        <h4 className="font-black text-white">${title}</h4>
      </div>
      ${error ? html`<p className="m-3 rounded-lg bg-rose-500/10 p-2 text-sm text-rose-200">${error}</p>` : null}
      ${loading
        ? html`<p className="p-3 text-sm text-slate-500">Loading assignments...</p>`
        : activeUsers.length === 0
          ? html`<p className="p-3 text-sm text-slate-500">No active assignments.</p>`
          : html`
              <div className="divide-y divide-slate-800/80">
                ${activeUsers.map(
                  (user) => html`
                    <div key=${user.id} className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-200">${user.email}</p>
                        ${user.required ? html`<p className="text-xs text-slate-500">Required admin</p>` : null}
                      </div>
                      ${user.required
                        ? html`<${IconBadge} icon=${Lock}>Built in</${IconBadge}>`
                        : html`
                            <${Button}
                              icon=${Trash2}
                              variant="danger"
                              disabled=${busyEmail === user.email}
                              onClick=${() => remove(user)}
                            >
                              ${busyEmail === user.email ? "Removing..." : "Remove"}
                            </${Button}>
                          `}
                    </div>
                  `,
                )}
              </div>
            `}
    </div>
  `;
}

function UserManagement({ profile, setToast }) {
  const { authorizedUsers, loading, error } = useAuthorizedUsers(true);

  return html`
    <div className="glass-panel rounded-xl p-4">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-mint">Access Control</p>
        <h3 className="mt-1 font-black text-white">User Management</h3>
      </div>
      ${error ? html`<p className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">${error}</p>` : null}
      <div className="grid gap-3 lg:grid-cols-2">
        <${AuthorizedUserForm} role=${ROLES.ADMIN} profile=${profile} setToast=${setToast} />
        <${AuthorizedUserForm} role=${ROLES.STUDIO_CREW} profile=${profile} setToast=${setToast} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <${AuthorizedUserList}
          title="Assigned Admins"
          role=${ROLES.ADMIN}
          users=${authorizedUsers}
          loading=${loading}
          setToast=${setToast}
        />
        <${AuthorizedUserList}
          title="Assigned Studio Crew"
          role=${ROLES.STUDIO_CREW}
          users=${authorizedUsers}
          loading=${loading}
          setToast=${setToast}
        />
      </div>
    </div>
  `;
}

function AdminPanel({ profile, taxonomy, announcements, setToast }) {
  const { rundowns, error: rundownsError } = useRundowns(hasAdminAccess(profile));
  const [newTaxonomy, setNewTaxonomy] = useState({ name: "", type: "category", color: "#2dd4bf" });

  const addTaxonomy = async (event) => {
    event.preventDefault();
    if (!safeText(newTaxonomy.name)) return;
    await addDoc(collection(db, "categories"), {
      name: safeText(newTaxonomy.name),
      type: newTaxonomy.type,
      color: newTaxonomy.color,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setNewTaxonomy({ name: "", type: newTaxonomy.type, color: "#2dd4bf" });
    setToast("Label added");
  };

  const softDelete = async (announcement) => {
    await updateDoc(doc(db, "announcements", announcement.id), {
      deletedAt: serverTimestamp(),
      status: "Archived",
      updatedAt: serverTimestamp(),
    });
    setToast("Announcement deleted");
  };

  const restore = async (announcement) => {
    await updateDoc(doc(db, "announcements", announcement.id), {
      deletedAt: null,
      status: "Submitted",
      updatedAt: serverTimestamp(),
    });
    setToast("Announcement restored");
  };

  const archiveRundown = async (rundown) => {
    await addDoc(collection(db, "broadcastHistory"), {
      rundownId: rundown.id,
      date: rundown.date,
      status: "Archived",
      locked: true,
      items: rundown.items || [],
      archivedBy: profile.uid,
      archivedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "rundowns", rundown.id), {
      status: "Archived",
      locked: true,
      updatedAt: serverTimestamp(),
    });
    setToast(`${toDateLabel(rundown.date)} archived`);
  };

  return html`
    <section className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-mint">Adviser Console</p>
        <h2 className="mt-1 text-2xl font-black text-white">Admin Role Management</h2>
      </div>
      ${rundownsError
        ? html`<p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">${rundownsError}</p>`
        : null}

      <${UserManagement} profile=${profile} setToast=${setToast} />

      <div>
        <div className="glass-panel rounded-xl p-4">
          <h3 className="mb-3 font-black text-white">Categories & Priority Labels</h3>
          <form onSubmit=${addTaxonomy} className="grid gap-3">
            <${TextInput}
              value=${newTaxonomy.name}
              onInput=${(event) => setNewTaxonomy({ ...newTaxonomy, name: event.currentTarget.value })}
              placeholder="Label name"
            />
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <${Select}
                value=${newTaxonomy.type}
                onChange=${(event) => setNewTaxonomy({ ...newTaxonomy, type: event.currentTarget.value })}
              >
                <option value="category">Category</option>
                <option value="priority">Priority</option>
              </${Select}>
              <input
                type="color"
                value=${newTaxonomy.color}
                onInput=${(event) => setNewTaxonomy({ ...newTaxonomy, color: event.currentTarget.value })}
                className="field h-11 p-1"
              />
            </div>
            <${Button} icon=${Plus} type="submit">Add label</${Button}>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            ${taxonomy.raw.map(
              (item) => html`
                <span
                  key=${item.id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-sm text-slate-200"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style=${{ background: item.color || "#94a3b8" }}></span>
                  ${item.name}
                  <button
                    type="button"
                    className="text-slate-500 hover:text-rose-200"
                    onClick=${() => deleteDoc(doc(db, "categories", item.id))}
                    aria-label=${`Delete ${item.name}`}
                  >
                    <${X} size=${14} />
                  </button>
                </span>
              `,
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-panel rounded-xl p-4">
          <h3 className="mb-3 font-black text-white">Announcement History</h3>
          <div className="space-y-3">
            ${announcements.slice(0, 12).map(
              (announcement) => html`
                <div key=${announcement.id} className="rounded-lg border border-slate-800 bg-slate-950/45 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-white">${announcement.title}</p>
                      <p className="text-sm text-slate-500">
                        ${announcement.submittedByName} - ${timestampLabel(announcement.updatedAt)}
                      </p>
                    </div>
                    <${StatusBadge} status=${announcement.deletedAt ? "Archived" : announcement.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    ${announcement.deletedAt
                      ? html`<${Button} icon=${RotateCcw} variant="secondary" onClick=${() => restore(announcement)}>Restore</${Button}>`
                      : html`<${Button} icon=${Trash2} variant="danger" onClick=${() => softDelete(announcement)}>Delete</${Button}>`}
                  </div>
                </div>
              `,
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <h3 className="mb-3 font-black text-white">Broadcast Archive</h3>
          <div className="space-y-3">
            ${rundowns.length === 0
              ? html`<p className="text-sm text-slate-500">No rundowns yet.</p>`
              : rundowns.slice(0, 12).map(
                  (rundown) => html`
                    <div key=${rundown.id} className="rounded-lg border border-slate-800 bg-slate-950/45 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-white">${toDateLabel(rundown.date)}</p>
                          <p className="text-sm text-slate-500">${(rundown.items || []).length} items</p>
                        </div>
                        <${StatusBadge} status=${rundown.status || "Draft"} />
                      </div>
                      <${Button}
                        icon=${Archive}
                        variant="ghost"
                        className="mt-3"
                        disabled=${rundown.status === "Archived"}
                        onClick=${() => archiveRundown(rundown)}
                      >
                        Archive
                      </${Button}>
                    </div>
                  `,
                )}
          </div>
        </div>
      </div>
    </section>
  `;
}

function Toast({ message }) {
  if (!message) return null;
  return html`
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-mint/25 bg-slate-950/95 p-4 text-sm font-bold text-white shadow-glow">
      ${message}
    </div>
  `;
}

function LoadingScreen() {
  return html`
    <main className="grid min-h-screen place-items-center px-4">
      <div className="glass-panel rounded-2xl p-6 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-mint"></div>
        <p className="font-bold text-white">Loading Broadcast Desk</p>
      </div>
    </main>
  `;
}

function AccessDeniedScreen({ profile, error }) {
  return html`
    <main className="grid min-h-screen place-items-center px-4">
      <section className="glass-panel w-full max-w-lg rounded-2xl p-5 text-center sm:p-7">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/30">
          <${ShieldCheck} size=${24} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-200">Access Denied</p>
        <h1 className="mt-2 text-2xl font-black text-white">This account is not authorized.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          ${profile?.email || "This Google account"} does not have Broadcast Desk access.
        </p>
        ${error ? html`<p className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">${error}</p>` : null}
        <${Button} icon=${LogOut} variant="ghost" className="mt-5 w-full" onClick=${() => signOut(auth)}>
          Sign out
        </${Button}>
      </section>
    </main>
  `;
}

function defaultViewForProfile(profile) {
  if (hasAdminAccess(profile)) return "admin";
  if (profile?.role === ROLES.STUDIO_CREW) return "studio";
  return "submit";
}

function App() {
  const { user, profile, loading, error } = useAuthProfile();
  const taxonomy = useTaxonomy(hasAppAccess(profile));
  const [view, setView] = useState("");
  const [toast, setToast] = useState("");
  const { announcements } = useAnnouncements(profile);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (profile?.role) setView(defaultViewForProfile(profile));
  }, [profile?.email, profile?.role]);

  if (loading) return html`<${LoadingScreen} />`;
  if (!user) return html`<${LoginScreen} error=${error} />`;
  if (!hasAppAccess(profile)) return html`<${AccessDeniedScreen} profile=${profile} error=${error} />`;

  const activeView = view || defaultViewForProfile(profile);
  let content = null;
  if (activeView === "submit" && canSubmitAnnouncements(profile)) {
    content = html`
      <${SubmissionForm}
        profile=${profile}
        taxonomy=${taxonomy}
        setToast=${setToast}
      />
    `;
  } else if (activeView === "mine" && canSubmitAnnouncements(profile)) {
    content = html`<${TeacherStatus} profile=${profile} taxonomy=${taxonomy} setToast=${setToast} />`;
  } else if (activeView === "studio" && hasStaffAccess(profile)) {
    content = html`<${StudioDashboard} profile=${profile} setToast=${setToast} />`;
  } else if (activeView === "rundown" && hasStaffAccess(profile)) {
    content = html`<${RundownBuilder} profile=${profile} setToast=${setToast} />`;
  } else if (activeView === "teleprompter" && hasStaffAccess(profile)) {
    content = html`<${TeleprompterMode} profile=${profile} />`;
  } else if (activeView === "admin" && hasAdminAccess(profile)) {
    content = html`
      <${AdminPanel}
        profile=${profile}
        taxonomy=${taxonomy}
        announcements=${announcements}
        setToast=${setToast}
      />
    `;
  } else {
    content = html`<${EmptyState} icon=${ShieldCheck} title="Access limited" body="Your role does not include this workspace." />`;
  }

  return html`
    <${AppShell} profile=${profile} taxonomy=${taxonomy} view=${activeView} setView=${setView}>
      ${content}
    </${AppShell}>
    <${Toast} message=${toast} />
  `;
}

createRoot(document.getElementById("root")).render(html`<${App} />`);
