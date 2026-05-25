import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { html } from "htm/react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  Gauge,
  LayoutGrid,
  ListChecks,
  LogIn,
  LogOut,
  Maximize,
  Minimize,
  Monitor,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  Radio,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  addDoc,
  auth,
  collection,
  db,
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

const VIDEO_ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  ACCESS_DENIED: "accessDenied",
};

const VIDEO_ROLE_LABELS = {
  [VIDEO_ROLES.ADMIN]: "Admin",
  [VIDEO_ROLES.TEACHER]: "Teacher",
  [VIDEO_ROLES.STUDENT]: "Student",
  [VIDEO_ROLES.ACCESS_DENIED]: "Access Denied",
};

const REQUIRED_VIDEO_ADMIN_EMAILS = [
  "joseph.clark@doralacademynv.org",
  "koby.walsh@doralacademynv.org",
];

const DORAL_STAFF_DOMAIN = "@doralacademynv.org";
const DORAL_STUDENT_DOMAIN = "@student.doralacademynv.org";

const DEFAULT_PRODUCTION_CHECKLIST = [
  "Equipment picked up",
  "Script finalized",
  "Shot list completed",
  "Intro filmed",
  "Interview filmed",
  "B-roll filmed",
  "Audio checked",
  "Outro filmed",
  "Footage reviewed",
  "Uploaded footage",
];

const DEFAULT_SHOTS = [
  "Opening establishing shot",
  "Main interview",
  "B-roll detail shot",
  "Closing shot",
];

const PROJECT_STATUSES = ["active", "paused", "complete", "archived"];
const FILMING_STATUSES = [
  "Not started",
  "Equipment check",
  "Writing",
  "Filming",
  "Reviewing footage",
  "Uploading",
  "Complete",
];
const CURRENT_TASKS = [
  "Equipment pickup",
  "Script writing",
  "Shot planning",
  "Intro filming",
  "Interview filming",
  "B-roll filming",
  "Audio check",
  "Footage review",
  "Upload",
];

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
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

function isRequiredVideoAdminEmail(email) {
  return REQUIRED_VIDEO_ADMIN_EMAILS.includes(normalizeEmail(email));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function splitEmails(value) {
  return [
    ...new Set(
      safeText(value)
        .split(/[\s,;]+/)
        .map(normalizeEmail)
        .filter(Boolean),
    ),
  ];
}

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
  if (!value) return "No activity yet";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFromEmail(email) {
  const name = normalizeEmail(email).split("@")[0] || "student";
  return name
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roleLabel(role) {
  return VIDEO_ROLE_LABELS[role] || VIDEO_ROLE_LABELS[VIDEO_ROLES.ACCESS_DENIED];
}

function hasVideoAccess(profile) {
  return [VIDEO_ROLES.ADMIN, VIDEO_ROLES.TEACHER, VIDEO_ROLES.STUDENT].includes(profile?.role);
}

function isVideoAdmin(profile) {
  return profile?.role === VIDEO_ROLES.ADMIN;
}

function isVideoTeacher(profile) {
  return profile?.role === VIDEO_ROLES.TEACHER;
}

function isVideoStudent(profile) {
  return profile?.role === VIDEO_ROLES.STUDENT;
}

function projectProgress(project) {
  const items = Array.isArray(project?.checklistItems) ? project.checklistItems : [];
  if (!items.length) return { completed: 0, total: 0, percent: 0 };
  const completed = items.filter((item) => item.completed).length;
  return {
    completed,
    total: items.length,
    percent: Math.round((completed / items.length) * 100),
  };
}

function progressTone(percent) {
  const hue = Math.round((Math.max(0, Math.min(100, percent)) / 100) * 126);
  return {
    background:
      `linear-gradient(135deg, hsla(${hue}, 76%, 42%, 0.26), rgba(8, 13, 23, 0.96) 54%)`,
    borderColor: `hsla(${hue}, 78%, 56%, 0.38)`,
  };
}

function normalizeChecklist(items) {
  return (Array.isArray(items) && items.length ? items : DEFAULT_PRODUCTION_CHECKLIST).map(
    (item) =>
      typeof item === "string"
        ? {
            id: makeId("check"),
            label: item,
            completed: false,
            completedBy: "",
            completedAt: "",
          }
        : {
            id: item.id || makeId("check"),
            label: safeText(item.label) || "Untitled task",
            completed: Boolean(item.completed),
            completedBy: safeText(item.completedBy),
            completedAt: item.completedAt || "",
          },
  );
}

function normalizeScriptSections(sections) {
  return (Array.isArray(sections) && sections.length
    ? sections
    : [{ id: makeId("scene"), title: "Opening", body: "" }]
  ).map((section, index) => ({
    id: section.id || makeId("scene"),
    title: safeText(section.title) || `Scene ${index + 1}`,
    body: typeof section.body === "string" ? section.body : "",
  }));
}

function normalizeShots(shots) {
  return (Array.isArray(shots) && shots.length ? shots : DEFAULT_SHOTS).map((shot, index) =>
    typeof shot === "string"
      ? {
          id: makeId("shot"),
          label: shot,
          notes: "",
          assignedTo: "",
          completed: false,
          completedBy: "",
          completedAt: "",
        }
      : {
          id: shot.id || makeId("shot"),
          label: safeText(shot.label) || `Shot ${index + 1}`,
          notes: safeText(shot.notes),
          assignedTo: safeText(shot.assignedTo),
          completed: Boolean(shot.completed),
          completedBy: safeText(shot.completedBy),
          completedAt: shot.completedAt || "",
        },
  );
}

function cleanProject(project) {
  return {
    ...project,
    checklistItems: normalizeChecklist(project?.checklistItems || []),
    scriptSections: normalizeScriptSections(project?.scriptSections || []),
    shotList: normalizeShots(project?.shotList || []),
    assignedStudentEmails: Array.isArray(project?.assignedStudentEmails)
      ? project.assignedStudentEmails.map(normalizeEmail).filter(Boolean)
      : [],
  };
}

function flattenStudentInterests(profile) {
  if (!profile) return [];
  const fields = [
    ["Favorite movies", profile.favoriteMovies],
    ["Favorite games", profile.favoriteGames],
    ["Favorite music", profile.favoriteMusic],
    ["Career interests", profile.careerGoals],
    ["Hobbies", profile.hobbies],
    ["Favorite creators", profile.favoriteCreators],
    ["Favorite sports", profile.favoriteSports],
    ["Production interests", profile.productionInterests],
  ];
  return fields
    .flatMap(([label, value]) =>
      splitProfileList(value).map((item) => `${label}: ${item}`),
    )
    .filter(Boolean);
}

function splitProfileList(value) {
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean);
  return safeText(value)
    .split(/[\n,;]+/)
    .map(safeText)
    .filter(Boolean);
}

async function resolveVideoRole(signedInUser) {
  const email = normalizeEmail(signedInUser?.email);
  if (!isAllowedDoralEmail(email)) return { email, role: VIDEO_ROLES.ACCESS_DENIED };
  if (isRequiredVideoAdminEmail(email)) return { email, role: VIDEO_ROLES.ADMIN };

  const userSnapshot = await getDoc(doc(db, "videoUsers", email));
  const assignedUser = userSnapshot.exists() ? userSnapshot.data() : null;
  if (
    assignedUser?.active === true &&
    assignedUser.email === email &&
    [VIDEO_ROLES.ADMIN, VIDEO_ROLES.TEACHER, VIDEO_ROLES.STUDENT].includes(assignedUser.role)
  ) {
    return { email, role: assignedUser.role };
  }

  if (isTeacherEmail(email)) return { email, role: VIDEO_ROLES.TEACHER };
  if (isStudentEmail(email)) return { email, role: VIDEO_ROLES.STUDENT };
  return { email, role: VIDEO_ROLES.ACCESS_DENIED };
}

function useVideoAuthProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
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
        const resolved = await resolveVideoRole(nextUser);
        setProfile({
          uid: nextUser.uid,
          displayName: nextUser.displayName || nextUser.email || "Production user",
          email: resolved.email,
          photoURL: nextUser.photoURL || "",
          role: resolved.role,
        });
      } catch (authError) {
        setError(authError.message);
        setProfile({
          uid: nextUser.uid,
          displayName: nextUser.displayName || nextUser.email || "Production user",
          email: normalizeEmail(nextUser.email),
          photoURL: nextUser.photoURL || "",
          role: VIDEO_ROLES.ACCESS_DENIED,
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { user, profile, loading, error };
}

function useVideoProjects(profile) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasVideoAccess(profile)) {
      setProjects([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    const projectsRef = collection(db, "videoProjects");
    const request = isVideoAdmin(profile)
      ? projectsRef
      : isVideoTeacher(profile)
        ? query(projectsRef, where("assignedTeacherEmail", "==", profile.email))
        : query(projectsRef, where("assignedStudentEmails", "array-contains", profile.email));

    const unsubscribe = onSnapshot(
      request,
      (snapshot) => {
        setProjects(
          snapshot.docs
            .map((item) => cleanProject({ id: item.id, ...item.data() }))
            .sort((a, b) => {
              const activeA = a.status === "active" ? 0 : 1;
              const activeB = b.status === "active" ? 0 : 1;
              return activeA - activeB || safeText(a.dueDate).localeCompare(safeText(b.dueDate));
            }),
        );
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [profile?.email, profile?.role]);

  return { projects, loading, error };
}

function useVideoUsers(enabled) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setUsers([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "videoUsers"),
      (snapshot) => {
        setUsers(
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

  return { users, loading, error };
}

function useVideoStudentProfiles(enabled) {
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setProfiles([]);
      setError("");
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "videoStudentProfiles"),
      (snapshot) => {
        setProfiles(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      },
      (snapshotError) => setError(snapshotError.message),
    );
    return unsubscribe;
  }, [enabled]);

  return { profiles, error };
}

async function addActivity(project, profile, action) {
  try {
    await addDoc(collection(db, "videoActivityLogs"), {
      projectId: project.id || project.projectId,
      projectTitle: project.title || "",
      userEmail: profile.email,
      userName: profile.displayName,
      action,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Activity logs are helpful for teachers, but they should not block student work.
  }
}

async function saveProjectPatch(project, profile, patch, action) {
  await updateDoc(doc(db, "videoProjects", project.id), {
    ...patch,
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
    lastActivityBy: profile.email,
  });
  if (action) await addActivity(project, profile, action);
}

function Button({ icon: Icon, variant = "primary", className = "", children, ...props }) {
  const styles = {
    primary: "bg-lens text-slate-950 hover:bg-sky-300",
    success: "bg-signal text-slate-950 hover:bg-green-300",
    danger: "bg-alert text-white hover:bg-red-400",
    warn: "bg-warning text-slate-950 hover:bg-amber-300",
    secondary: "bg-slate-800 text-slate-100 ring-1 ring-slate-700 hover:bg-slate-700",
    ghost: "bg-slate-950/20 text-slate-200 ring-1 ring-slate-700/70 hover:bg-slate-800/80",
  };

  return html`
    <button
      ...${props}
      className=${classNames(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition",
        styles[variant] || styles.primary,
        className,
      )}
    >
      ${Icon ? html`<${Icon} size=${17} />` : null}
      ${children}
    </button>
  `;
}

function TextInput(props) {
  return html`<input ...${props} className=${classNames("vp-field px-3 py-3", props.className)} />`;
}

function Textarea(props) {
  return html`
    <textarea ...${props} className=${classNames("vp-field min-h-28 px-3 py-3", props.className)} />
  `;
}

function Select(props) {
  return html`<select ...${props} className=${classNames("vp-field px-3 py-3", props.className)} />`;
}

function Badge({ icon: Icon, children, className = "" }) {
  return html`
    <span className=${classNames("inline-flex items-center gap-2 rounded-full bg-slate-950/55 px-3 py-1 text-xs font-black text-slate-200 ring-1 ring-slate-700/70", className)}>
      ${Icon ? html`<${Icon} size=${14} />` : null}
      ${children}
    </span>
  `;
}

function EmptyState({ icon: Icon = Sparkles, title, body }) {
  return html`
    <section className="vp-panel rounded-2xl p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lens/12 text-lens ring-1 ring-lens/25">
        <${Icon} size=${24} />
      </div>
      <h2 className="text-lg font-black text-white">${title}</h2>
      ${body ? html`<p className="mt-2 text-sm leading-6 text-slate-400">${body}</p>` : null}
    </section>
  `;
}

function LoadingScreen() {
  return html`
    <main className="grid min-h-screen place-items-center px-4">
      <div className="vp-panel rounded-3xl p-7 text-center">
        <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-2 border-slate-700 border-t-lens"></div>
        <p className="font-black text-white">Loading Video Production Studio</p>
      </div>
    </main>
  `;
}

function Toast({ message }) {
  if (!message) return null;
  return html`
    <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-lens/25 bg-slate-950/95 p-4 text-sm font-black text-white shadow-monitor">
      ${message}
    </div>
  `;
}

function VideoLogin({ error }) {
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
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-lens/25 bg-lens/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-lens">
            <span className="h-2 w-2 rounded-full bg-signal shadow-[0_0_18px_rgba(34,197,94,0.9)]"></span>
            Field Production
          </div>
          <div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              Video Production Studio
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Live filming workflows for student crews and a teacher monitor board for field production days.
            </p>
          </div>
          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            <InfoTile value="Live" label="Progress" icon=${Activity} />
            <InfoTile value="Tablet" label="Filming mode" icon=${Camera} />
            <InfoTile value="Teacher" label="Monitor board" icon=${Monitor} />
          </div>
        </section>

        <section className="vp-panel rounded-3xl p-5 sm:p-7">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/46 p-4">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Sign In
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">Open production tools</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lens/10 text-lens ring-1 ring-lens/25">
                <${Video} size=${24} />
              </div>
            </div>
            <${Button} icon=${LogIn} onClick=${signIn} disabled=${busy} className="w-full">
              ${busy ? "Connecting..." : "Continue with Google"}
            </${Button}>
            ${error ? html`<p className="mt-4 rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
            <div className="mt-6 grid gap-3 text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <${Check} className="text-signal" size=${16} />
                <span>Students only see assigned project workflows.</span>
              </div>
              <div className="flex items-center gap-3">
                <${Check} className="text-signal" size=${16} />
                <span>Teachers monitor active sessions in real time.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  `;
}

function InfoTile({ value, label, icon: Icon }) {
  return html`
    <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-lens/10 text-lens">
        <${Icon} size=${18} />
      </div>
      <p className="text-lg font-black text-white">${value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">${label}</p>
    </div>
  `;
}

function AccessDeniedScreen({ profile, error }) {
  return html`
    <main className="grid min-h-screen place-items-center px-4">
      <section className="vp-panel w-full max-w-lg rounded-3xl p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-alert/15 text-red-100 ring-1 ring-red-400/30">
          <${ShieldCheck} size=${24} />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">Access Denied</p>
        <h1 className="mt-2 text-2xl font-black text-white">This account is not authorized.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          ${profile?.email || "This Google account"} does not have Video Production Studio access.
        </p>
        ${error ? html`<p className="mt-4 rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
        <${Button} icon=${LogOut} variant="ghost" className="mt-5 w-full" onClick=${() => signOut(auth)}>
          Sign out
        </${Button}>
      </section>
    </main>
  `;
}

function defaultViewForProfile(profile) {
  if (isVideoStudent(profile)) return "filming";
  if (isVideoTeacher(profile) || isVideoAdmin(profile)) return "monitor";
  return "filming";
}

function VideoShell({ profile, view, setView, kioskActive, children }) {
  const nav = [
    { id: "filming", label: "Filming", icon: Camera, show: isVideoStudent(profile) },
    { id: "profile", label: "Profile", icon: UserCog, show: isVideoStudent(profile) },
    { id: "monitor", label: "Monitor", icon: Monitor, show: isVideoTeacher(profile) || isVideoAdmin(profile) },
    { id: "projects", label: "Projects", icon: ClipboardCheck, show: isVideoTeacher(profile) || isVideoAdmin(profile) },
    { id: "users", label: "Users", icon: Users, show: isVideoAdmin(profile) },
  ].filter((item) => item.show);

  useEffect(() => {
    if (!nav.some((item) => item.id === view)) setView(nav[0]?.id || "filming");
  }, [profile?.role, view]);

  return html`
    <div className="min-h-screen">
      ${kioskActive
        ? null
        : html`
            <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-coal/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lens text-slate-950">
                    <${Camera} size=${22} strokeWidth=${2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase tracking-[0.22em] text-white">
                      Video Production Studio
                    </p>
                    <p className="truncate text-xs text-slate-500">${profile?.displayName} - ${roleLabel(profile?.role)}</p>
                    <p className="hidden truncate text-[11px] text-slate-600 sm:block">${profile?.email}</p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  <${Badge} icon=${Radio} className="text-lens">Live workflow</${Badge}>
                  <${Button} icon=${LogOut} variant="ghost" onClick=${() => signOut(auth)}>Sign out</${Button}>
                </div>
              </div>
              <nav className="mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto pb-1 vp-scroll">
                ${nav.map(
                  (item) => html`
                    <button
                      key=${item.id}
                      type="button"
                      onClick=${() => setView(item.id)}
                      className=${classNames(
                        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition",
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
                <${Button} icon=${LogOut} variant="ghost" className="md:hidden" onClick=${() => signOut(auth)}>
                  Sign out
                </${Button}>
              </nav>
            </header>
          `}
      <main className=${classNames(kioskActive ? "" : "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8")}>
        ${children}
      </main>
    </div>
  `;
}

function MonitorDashboard({ projects, loading, error, studentProfiles }) {
  const [interestIndex, setInterestIndex] = useState(0);
  const activeProjects = projects.filter((project) => project.status !== "archived");
  const profileByEmail = useMemo(() => {
    const map = new Map();
    studentProfiles.forEach((profile) => map.set(normalizeEmail(profile.email || profile.id), profile));
    return map;
  }, [studentProfiles]);

  useEffect(() => {
    const interval = window.setInterval(() => setInterestIndex((current) => current + 1), 4200);
    return () => window.clearInterval(interval);
  }, []);

  return html`
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-lens">Live Operations Board</p>
          <h1 className="mt-1 text-3xl font-black text-white">Teacher Monitor</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Active filming sessions update live as student crews check off production work.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <${Badge} icon=${Activity}>${activeProjects.length} active sessions</${Badge}>
          <${Badge} icon=${Clock}>Live Firestore updates</${Badge}>
        </div>
      </div>

      ${error ? html`<p className="rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}

      ${loading
        ? html`<${EmptyState} icon=${Activity} title="Loading live projects" />`
        : activeProjects.length === 0
          ? html`<${EmptyState} icon=${Monitor} title="No active filming sessions" body="Create a project and assign students to see live progress here." />`
          : html`
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                ${activeProjects.map(
                  (project) => html`
                    <${ProjectMonitorCard}
                      key=${project.id}
                      project=${project}
                      profileByEmail=${profileByEmail}
                      interestIndex=${interestIndex}
                    />
                  `,
                )}
              </div>
            `}
    </section>
  `;
}

function ProjectMonitorCard({ project, profileByEmail, interestIndex }) {
  const progress = projectProgress(project);
  const students = project.assignedStudentEmails || [];
  const interestPool = students.flatMap((email) =>
    flattenStudentInterests(profileByEmail.get(normalizeEmail(email))).map(
      (interest) => `${titleFromEmail(email)} - ${interest}`,
    ),
  );
  const rotatingInterest = interestPool.length
    ? interestPool[interestIndex % interestPool.length]
    : "No student profile interests shared yet.";

  return html`
    <article className="vp-panel vp-fade rounded-3xl p-4" style=${progressTone(progress.percent)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">${project.groupName || "Production crew"}</p>
          <h2 className="mt-1 truncate text-xl font-black text-white">${project.title}</h2>
          <p className="mt-1 text-sm text-slate-300">${students.length} student${students.length === 1 ? "" : "s"} assigned</p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 px-3 py-2 text-right ring-1 ring-white/10">
          <p className="text-2xl font-black text-white">${progress.percent}%</p>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">complete</p>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-950/70 ring-1 ring-white/10">
        <div className="h-full rounded-full bg-white transition-all duration-500" style=${{ width: `${progress.percent}%` }}></div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-300">
        <div className="rounded-2xl bg-slate-950/42 p-3 ring-1 ring-white/10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Current task</p>
          <p className="mt-1 font-black text-white">${project.currentTask || "Not set"}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-950/42 p-3 ring-1 ring-white/10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Status</p>
            <p className="mt-1 font-black text-white">${project.filmingStatus || "Not started"}</p>
          </div>
          <div className="rounded-2xl bg-slate-950/42 p-3 ring-1 ring-white/10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Latest activity</p>
            <p className="mt-1 font-black text-white">${timestampLabel(project.lastActivityAt || project.updatedAt)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-lens/20 bg-lens/10 p-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-lens">Student rotation</p>
        <p className="mt-2 min-h-10 text-sm font-semibold leading-5 text-slate-100">${rotatingInterest}</p>
      </div>
    </article>
  `;
}

function ProjectManager({ profile, projects, loading, error, setToast }) {
  return html`
    <section className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-lens">Project Control</p>
        <h1 className="mt-1 text-3xl font-black text-white">Production Projects</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Create field production assignments for student crews in a separate production workflow.
        </p>
      </div>

      <${ProjectCreateForm} profile=${profile} setToast=${setToast} />

      ${error ? html`<p className="rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
      ${loading
        ? html`<${EmptyState} icon=${ClipboardCheck} title="Loading projects" />`
        : html`
            <div className="grid gap-4 lg:grid-cols-2">
              ${projects.map(
                (project) => html`
                  <${ProjectAdminCard} key=${project.id} profile=${profile} project=${project} setToast=${setToast} />
                `,
              )}
            </div>
          `}
    </section>
  `;
}

function ProjectCreateForm({ profile, setToast }) {
  const [form, setForm] = useState({
    title: "",
    objective: "",
    dueDate: todayISO(),
    groupName: "",
    assignedStudents: "",
    assignedTeacherEmail: profile.email,
    teacherNotes: "",
    groupMode: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const assignedStudentEmails = splitEmails(form.assignedStudents);
    const assignedTeacherEmail = normalizeEmail(
      isVideoAdmin(profile) ? form.assignedTeacherEmail : profile.email,
    );

    if (!safeText(form.title) || !safeText(form.objective)) {
      setError("Project title and objective are required.");
      return;
    }
    if (!assignedStudentEmails.length) {
      setError("Assign at least one student email.");
      return;
    }
    if (assignedStudentEmails.some((email) => !isAllowedDoralEmail(email))) {
      setError("Assigned students must use Doral email accounts.");
      return;
    }
    if (!isTeacherEmail(assignedTeacherEmail)) {
      setError("Assigned teacher must use a @doralacademynv.org email.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: safeText(form.title),
        objective: safeText(form.objective),
        description: safeText(form.objective),
        dueDate: form.dueDate || todayISO(),
        groupName: safeText(form.groupName) || "Production Group",
        groupMode: Boolean(form.groupMode),
        assignedStudentEmails,
        assignedStudentNames: assignedStudentEmails.map(titleFromEmail),
        assignedTeacherEmail,
        assignedTeacherName:
          assignedTeacherEmail === profile.email ? profile.displayName : titleFromEmail(assignedTeacherEmail),
        teacherNotes: safeText(form.teacherNotes),
        status: "active",
        filmingStatus: "Not started",
        currentTask: "Equipment pickup",
        checklistItems: normalizeChecklist(DEFAULT_PRODUCTION_CHECKLIST),
        scriptSections: normalizeScriptSections([]),
        shotList: normalizeShots(DEFAULT_SHOTS),
        createdBy: profile.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        lastActivityBy: profile.email,
      };
      const projectRef = await addDoc(collection(db, "videoProjects"), payload);
      await updateDoc(projectRef, { projectId: projectRef.id });
      await addActivity({ id: projectRef.id, title: payload.title }, profile, "Created project");
      setForm({
        title: "",
        objective: "",
        dueDate: todayISO(),
        groupName: "",
        assignedStudents: "",
        assignedTeacherEmail: profile.email,
        teacherNotes: "",
        groupMode: true,
      });
      setToast("Production project created");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return html`
    <form onSubmit=${submit} className="vp-panel rounded-3xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Create project</h2>
          <p className="text-sm text-slate-400">Assign a field workflow to one student or a group.</p>
        </div>
        <${Badge} icon=${Plus}>New</${Badge}>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold text-slate-300">
          Project title
          <${TextInput} value=${form.title} onInput=${(event) => update("title", event.currentTarget.value)} placeholder="Documentary opening package" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-300">
          Due date
          <${TextInput} type="date" value=${form.dueDate} onInput=${(event) => update("dueDate", event.currentTarget.value)} />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-300">
          Group name
          <${TextInput} value=${form.groupName} onInput=${(event) => update("groupName", event.currentTarget.value)} placeholder="Period 4 Crew A" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-300">
          Assigned student emails
          <${TextInput} value=${form.assignedStudents} onInput=${(event) => update("assignedStudents", event.currentTarget.value)} placeholder="student@student.doralacademynv.org" />
        </label>
        ${isVideoAdmin(profile)
          ? html`
              <label className="grid gap-1 text-sm font-bold text-slate-300">
                Assigned teacher email
                <${TextInput} value=${form.assignedTeacherEmail} onInput=${(event) => update("assignedTeacherEmail", event.currentTarget.value)} />
              </label>
            `
          : null}
        <label className="flex items-center gap-3 rounded-2xl bg-slate-950/40 p-3 text-sm font-bold text-slate-300 ring-1 ring-slate-700/70">
          <input type="checkbox" checked=${form.groupMode} onChange=${(event) => update("groupMode", event.currentTarget.checked)} />
          Group mode
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-300 md:col-span-2">
          Objective
          <${Textarea} value=${form.objective} onInput=${(event) => update("objective", event.currentTarget.value)} placeholder="What students need to produce and capture." />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-300 md:col-span-2">
          Teacher notes
          <${Textarea} value=${form.teacherNotes} onInput=${(event) => update("teacherNotes", event.currentTarget.value)} placeholder="Location, interview reminders, constraints, or safety notes." />
        </label>
      </div>
      ${error ? html`<p className="mt-3 rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
      <div className="mt-4 flex justify-end">
        <${Button} icon=${Plus} type="submit" disabled=${busy}>${busy ? "Creating..." : "Create project"}</${Button}>
      </div>
    </form>
  `;
}

function ProjectAdminCard({ profile, project, setToast }) {
  const progress = projectProgress(project);
  const [busy, setBusy] = useState(false);

  const updateStatus = async (status) => {
    setBusy(true);
    try {
      await saveProjectPatch(project, profile, { status }, `Marked project ${status}`);
      setToast(`Project marked ${status}`);
    } catch (statusError) {
      setToast(statusError.message);
    } finally {
      setBusy(false);
    }
  };

  return html`
    <article className="vp-panel rounded-3xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-white">${project.title}</h3>
          <p className="mt-1 text-sm text-slate-400">${project.groupName} - Due ${toDateLabel(project.dueDate)}</p>
        </div>
        <${Badge} icon=${Gauge}>${progress.percent}%</${Badge}>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">${project.objective}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <${Badge} icon=${Users}>${(project.assignedStudentEmails || []).length} students</${Badge}>
        <${Badge} icon=${UserCog}>${project.assignedTeacherEmail}</${Badge}>
        <${Badge} icon=${Radio}>${project.status}</${Badge}>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950/70">
        <div className="h-full rounded-full bg-lens" style=${{ width: `${progress.percent}%` }}></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        ${PROJECT_STATUSES.map(
          (status) => html`
            <${Button}
              key=${status}
              type="button"
              variant=${project.status === status ? "primary" : "ghost"}
              disabled=${busy}
              onClick=${() => updateStatus(status)}
            >
              ${status}
            </${Button}>
          `,
        )}
      </div>
    </article>
  `;
}

function StudentFilmingHome({ profile, projects, loading, error, setToast, setKioskActive }) {
  const activeProjects = projects.filter((project) => project.status !== "archived");
  const [selectedProjectId, setSelectedProjectId] = useState(() =>
    window.sessionStorage.getItem("videoStudio.selectedProjectId") || "",
  );

  useEffect(() => {
    if (!activeProjects.length) return;
    if (!activeProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(activeProjects[0].id);
      window.sessionStorage.setItem("videoStudio.selectedProjectId", activeProjects[0].id);
    }
  }, [activeProjects.map((project) => project.id).join("|"), selectedProjectId]);

  const selectedProject = activeProjects.find((project) => project.id === selectedProjectId);

  if (loading) return html`<${EmptyState} icon=${Camera} title="Loading assigned projects" />`;
  if (error) return html`<${EmptyState} icon=${AlertTriangle} title="Project access error" body=${error} />`;
  if (!activeProjects.length) {
    return html`
      <${EmptyState}
        icon=${Camera}
        title="No assigned filming project"
        body="Your teacher must assign your email to a Video Production Studio project before this page opens."
      />
    `;
  }

  return html`
    <section className="space-y-4">
      ${activeProjects.length > 1
        ? html`
            <div className="vp-panel rounded-3xl p-4">
              <label className="grid gap-2 text-sm font-bold text-slate-300">
                Assigned project
                <${Select}
                  value=${selectedProjectId}
                  onChange=${(event) => {
                    setSelectedProjectId(event.currentTarget.value);
                    window.sessionStorage.setItem("videoStudio.selectedProjectId", event.currentTarget.value);
                  }}
                >
                  ${activeProjects.map(
                    (project) => html`<option key=${project.id} value=${project.id}>${project.title}</option>`,
                  )}
                </${Select}>
              </label>
            </div>
          `
        : null}
      ${selectedProject
        ? html`
            <${FilmingWorkspace}
              profile=${profile}
              project=${selectedProject}
              setToast=${setToast}
              setKioskActive=${setKioskActive}
            />
          `
        : null}
    </section>
  `;
}

function FilmingWorkspace({ profile, project, setToast, setKioskActive }) {
  const [filmingMode, setFilmingMode] = useState(false);
  const [focusWarning, setFocusWarning] = useState(false);
  const [readMode, setReadMode] = useState(false);
  const [scriptDraft, setScriptDraft] = useState(() => normalizeScriptSections(project.scriptSections));
  const [scriptDirty, setScriptDirty] = useState(false);
  const [scriptSaving, setScriptSaving] = useState(false);

  useEffect(() => {
    if (!scriptDirty) setScriptDraft(normalizeScriptSections(project.scriptSections));
  }, [project.id, project.scriptSections]);

  useEffect(() => {
    setKioskActive(Boolean(filmingMode));
    return () => setKioskActive(false);
  }, [filmingMode]);

  useEffect(() => {
    if (!filmingMode) return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const visibility = () => {
      if (document.hidden) setFocusWarning(true);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [filmingMode]);

  useEffect(() => {
    if (!scriptDirty) return undefined;
    const timeout = window.setTimeout(async () => {
      setScriptSaving(true);
      try {
        await saveProjectPatch(
          project,
          profile,
          { scriptSections: normalizeScriptSections(scriptDraft) },
          "Autosaved script",
        );
        setScriptDirty(false);
      } catch (saveError) {
        setToast(saveError.message);
      } finally {
        setScriptSaving(false);
      }
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [scriptDraft, scriptDirty, project.id]);

  const progress = projectProgress(project);

  const toggleChecklist = async (itemId) => {
    const nextItems = project.checklistItems.map((item) => {
      if (item.id !== itemId) return item;
      const completed = !item.completed;
      return {
        ...item,
        completed,
        completedBy: completed ? profile.email : "",
        completedAt: completed ? new Date().toISOString() : "",
      };
    });
    await saveProjectPatch(project, profile, { checklistItems: nextItems }, "Updated checklist");
  };

  const updateFilmingField = async (field, value) => {
    await saveProjectPatch(project, profile, { [field]: value }, `Updated ${field}`);
  };

  const addScriptSection = () => {
    setScriptDraft((current) => [
      ...current,
      { id: makeId("scene"), title: `Scene ${current.length + 1}`, body: "" },
    ]);
    setScriptDirty(true);
  };

  const updateScript = (sectionId, patch) => {
    setScriptDraft((current) =>
      current.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
    );
    setScriptDirty(true);
  };

  const removeScriptSection = (sectionId) => {
    setScriptDraft((current) => current.filter((section) => section.id !== sectionId));
    setScriptDirty(true);
  };

  const addShot = async (label) => {
    const nextShots = [
      ...project.shotList,
      {
        id: makeId("shot"),
        label,
        notes: "",
        assignedTo: "",
        completed: false,
        completedBy: "",
        completedAt: "",
      },
    ];
    await saveProjectPatch(project, profile, { shotList: nextShots }, "Added shot");
  };

  const updateShot = async (shotId, patch, action = "Updated shot list") => {
    const nextShots = project.shotList.map((shot) =>
      shot.id === shotId ? { ...shot, ...patch } : shot,
    );
    await saveProjectPatch(project, profile, { shotList: nextShots }, action);
  };

  const removeShot = async (shotId) => {
    await saveProjectPatch(
      project,
      profile,
      { shotList: project.shotList.filter((shot) => shot.id !== shotId) },
      "Removed shot",
    );
  };

  return html`
    <div className=${classNames(filmingMode ? "fixed inset-0 z-50 overflow-y-auto vp-kiosk px-3 py-3 sm:px-5" : "space-y-4")}>
      <section className="vp-panel rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lens">Student Filming Workflow</p>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-4xl">${project.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">${project.objective}</p>
          </div>
          <div className="grid gap-2 sm:min-w-72">
            <${Button}
              icon=${filmingMode ? Minimize : Maximize}
              variant=${filmingMode ? "warn" : "primary"}
              onClick=${() => setFilmingMode((current) => !current)}
            >
              ${filmingMode ? "Exit Filming Mode" : "Enter Filming Mode"}
            </${Button}>
            <${Button} icon=${BookOpen} variant="secondary" onClick=${() => setReadMode(true)}>
              Read Script
            </${Button}>
          </div>
        </div>

        ${focusWarning
          ? html`
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm text-amber-100">
                <${AlertTriangle} className="mt-0.5 shrink-0" size=${18} />
                <div>
                  <p className="font-black">Focus warning</p>
                  <p className="leading-6">The filming app detected a focus change. Stay in this workflow until your teacher releases the crew.</p>
                </div>
                <button className="ml-auto text-amber-100" onClick=${() => setFocusWarning(false)}><${X} size=${18} /></button>
              </div>
            `
          : null}

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-950/42 p-3 ring-1 ring-slate-700/70">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Due</p>
            <p className="mt-1 font-black text-white">${toDateLabel(project.dueDate)}</p>
          </div>
          <div className="rounded-2xl bg-slate-950/42 p-3 ring-1 ring-slate-700/70">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Group</p>
            <p className="mt-1 font-black text-white">${project.groupName}</p>
          </div>
          <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Status
            <${Select}
              value=${project.filmingStatus || "Not started"}
              onChange=${(event) => updateFilmingField("filmingStatus", event.currentTarget.value)}
            >
              ${FILMING_STATUSES.map((status) => html`<option key=${status} value=${status}>${status}</option>`)}
            </${Select}>
          </label>
          <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Current task
            <${Select}
              value=${project.currentTask || "Equipment pickup"}
              onChange=${(event) => updateFilmingField("currentTask", event.currentTarget.value)}
            >
              ${CURRENT_TASKS.map((task) => html`<option key=${task} value=${task}>${task}</option>`)}
            </${Select}>
          </label>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm font-black text-white">
            <span>Checklist progress</span>
            <span>${progress.completed}/${progress.total} - ${progress.percent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-950/70 ring-1 ring-slate-700/70">
            <div className="h-full rounded-full bg-signal transition-all duration-500" style=${{ width: `${progress.percent}%` }}></div>
          </div>
        </div>
      </section>

      ${project.teacherNotes
        ? html`
            <section className="rounded-3xl border border-lens/20 bg-lens/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-lens">Teacher Notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-100">${project.teacherNotes}</p>
            </section>
          `
        : null}

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <${ProductionChecklist} items=${project.checklistItems} onToggle=${toggleChecklist} />
        <${ScriptWritingPanel}
          sections=${scriptDraft}
          saving=${scriptSaving}
          onAdd=${addScriptSection}
          onUpdate=${updateScript}
          onRemove=${removeScriptSection}
        />
      </section>

      <${ShotPlanningPanel}
        shots=${project.shotList}
        students=${project.assignedStudentEmails}
        onAdd=${addShot}
        onUpdate=${updateShot}
        onRemove=${removeShot}
        profile=${profile}
      />

      ${filmingMode
        ? html`
            <section className="rounded-3xl border border-slate-700/70 bg-slate-950/72 p-4 text-sm leading-6 text-slate-300">
              <p className="font-black text-white">Lockdown guidance</p>
              <p className="mt-1">
                App focus tools help prevent accidental navigation, but true device lockdown should use Guided Access on iPad, Android kiosk mode, Managed Chromebook kiosk mode, or a tested lockdown browser.
              </p>
            </section>
          `
        : null}

      ${readMode
        ? html`
            <${ScriptReader}
              sections=${normalizeScriptSections(scriptDraft)}
              onClose=${() => setReadMode(false)}
            />
          `
        : null}
    </div>
  `;
}

function ProductionChecklist({ items, onToggle }) {
  return html`
    <section className="vp-panel rounded-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Production Checklist</h2>
          <p className="text-sm text-slate-400">Touch each task as the crew finishes it.</p>
        </div>
        <${Badge} icon=${ListChecks}>Live</${Badge}>
      </div>
      <div className="grid gap-2">
        ${items.map(
          (item) => html`
            <button
              key=${item.id}
              type="button"
              onClick=${() => onToggle(item.id)}
              className=${classNames(
                "flex min-h-14 items-center gap-3 rounded-2xl border p-3 text-left transition",
                item.completed
                  ? "border-signal/35 bg-signal/12 text-green-100"
                  : "border-slate-700/70 bg-slate-950/45 text-slate-200 hover:border-lens/45",
              )}
            >
              ${item.completed
                ? html`<${CheckCircle2} className="shrink-0 text-signal" size=${24} />`
                : html`<${Circle} className="shrink-0 text-slate-500" size=${24} />`}
              <span className=${classNames("font-black", item.completed ? "line-through decoration-green-300/70" : "")}>
                ${item.label}
              </span>
            </button>
          `,
        )}
      </div>
    </section>
  `;
}

function ScriptWritingPanel({ sections, saving, onAdd, onUpdate, onRemove }) {
  return html`
    <section className="vp-panel rounded-3xl p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Script Writing</h2>
          <p className="text-sm text-slate-400">${saving ? "Autosaving..." : "Autosaves as students write."}</p>
        </div>
        <${Button} icon=${Plus} variant="secondary" onClick=${onAdd}>Scene</${Button}>
      </div>
      <div className="grid gap-3">
        ${sections.map(
          (section, index) => html`
            <article key=${section.id} className="rounded-2xl border border-slate-700/70 bg-slate-950/42 p-3">
              <div className="mb-2 flex items-center gap-2">
                <${TextInput}
                  value=${section.title}
                  onInput=${(event) => onUpdate(section.id, { title: event.currentTarget.value })}
                  aria-label=${`Scene ${index + 1} title`}
                />
                ${sections.length > 1
                  ? html`
                      <${Button} icon=${Trash2} variant="ghost" onClick=${() => onRemove(section.id)} />
                    `
                  : null}
              </div>
              <${Textarea}
                value=${section.body}
                onInput=${(event) => onUpdate(section.id, { body: event.currentTarget.value })}
                placeholder="Write anchor lines, narration, interview setup, or scene copy."
                className="min-h-40"
              />
            </article>
          `,
        )}
      </div>
    </section>
  `;
}

function ShotPlanningPanel({ shots, students, onAdd, onUpdate, onRemove, profile }) {
  const [newShot, setNewShot] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const label = safeText(newShot);
    if (!label) return;
    await onAdd(label);
    setNewShot("");
  };

  return html`
    <section className="vp-panel rounded-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Shot Planning</h2>
          <p className="text-sm text-slate-400">Track shots, notes, and filming responsibilities.</p>
        </div>
        <${Badge} icon=${Target}>${shots.filter((shot) => shot.completed).length}/${shots.length}</${Badge}>
      </div>
      <form onSubmit=${submit} className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <${TextInput} value=${newShot} onInput=${(event) => setNewShot(event.currentTarget.value)} placeholder="Add a new shot" />
        <${Button} icon=${Plus} type="submit">Add shot</${Button}>
      </form>
      <div className="grid gap-3 lg:grid-cols-2">
        ${shots.map(
          (shot) => html`
            <article key=${shot.id} className="rounded-2xl border border-slate-700/70 bg-slate-950/42 p-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-1 text-signal"
                  onClick=${() =>
                    onUpdate(
                      shot.id,
                      {
                        completed: !shot.completed,
                        completedBy: !shot.completed ? profile.email : "",
                        completedAt: !shot.completed ? new Date().toISOString() : "",
                      },
                      !shot.completed ? "Completed shot" : "Reopened shot",
                    )}
                >
                  ${shot.completed ? html`<${CheckCircle2} size=${24} />` : html`<${Circle} size=${24} />`}
                </button>
                <div className="min-w-0 flex-1 space-y-2">
                  <${TextInput}
                    value=${shot.label}
                    onInput=${(event) => onUpdate(shot.id, { label: event.currentTarget.value })}
                    aria-label="Shot label"
                  />
                  <${Textarea}
                    value=${shot.notes}
                    onInput=${(event) => onUpdate(shot.id, { notes: event.currentTarget.value })}
                    placeholder="Scene notes, framing, or audio reminders"
                    className="min-h-20"
                  />
                  <${Select}
                    value=${shot.assignedTo}
                    onChange=${(event) => onUpdate(shot.id, { assignedTo: event.currentTarget.value })}
                  >
                    <option value="">Unassigned</option>
                    ${students.map((email) => html`<option key=${email} value=${email}>${titleFromEmail(email)}</option>`)}
                  </${Select}>
                </div>
                <${Button} icon=${Trash2} variant="ghost" onClick=${() => onRemove(shot.id)} />
              </div>
            </article>
          `,
        )}
      </div>
    </section>
  `;
}

function ScriptReader({ sections, onClose }) {
  const stageRef = useRef(null);
  const scrollRef = useRef(null);
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState(44);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(34);

  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now) => {
      const elapsed = now - last;
      last = now;
      if (scrollRef.current) scrollRef.current.scrollTop += (speed * elapsed) / 1000;
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, speed]);

  useEffect(() => {
    const keyHandler = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((current) => !current);
      }
      if (event.key === "ArrowUp") setSpeed((current) => Math.max(6, current - 4));
      if (event.key === "ArrowDown") setSpeed((current) => Math.min(120, current + 4));
      if (event.key === "+" || event.key === "=") setFontSize((current) => Math.min(80, current + 4));
      if (event.key === "-" || event.key === "_") setFontSize((current) => Math.max(26, current - 4));
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [onClose]);

  const fullscreen = async () => {
    if (!document.fullscreenElement && stageRef.current?.requestFullscreen) {
      await stageRef.current.requestFullscreen();
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  };

  return html`
    <section
      ref=${stageRef}
      className=${classNames(
        "vp-script-reader fixed inset-0 z-[70] flex flex-col",
        theme === "dark" ? "bg-black text-white" : "bg-white text-slate-950",
      )}
    >
      <div className=${classNames("flex flex-wrap items-center justify-between gap-2 border-b p-3", theme === "dark" ? "border-white/10 bg-black/88" : "border-slate-200 bg-white/88")}>
        <div className="flex items-center gap-2">
          <${Button} icon=${playing ? Pause : Play} variant=${theme === "dark" ? "secondary" : "primary"} onClick=${() => setPlaying((current) => !current)}>
            ${playing ? "Pause" : "Play"}
          </${Button}>
          <${Button} icon=${Maximize} variant="ghost" onClick=${fullscreen}>Fullscreen</${Button}>
          <${Button} icon=${theme === "dark" ? Sun : Moon} variant="ghost" onClick=${() => setTheme((current) => (current === "dark" ? "light" : "dark"))}>
            ${theme === "dark" ? "Light" : "Dark"}
          </${Button}>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-black">
          <label className="flex items-center gap-2">
            Speed
            <input type="range" min="6" max="120" value=${speed} onInput=${(event) => setSpeed(Number(event.currentTarget.value))} />
          </label>
          <label className="flex items-center gap-2">
            Text
            <input type="range" min="26" max="80" value=${fontSize} onInput=${(event) => setFontSize(Number(event.currentTarget.value))} />
          </label>
          <${Button} icon=${X} variant="danger" onClick=${onClose}>Close</${Button}>
        </div>
      </div>
      <div ref=${scrollRef} className="vp-scroll flex-1 overflow-y-auto px-5 py-12 sm:px-12">
        <div className="mx-auto max-w-5xl space-y-14 pb-40" style=${{ fontSize: `${fontSize}px`, lineHeight: 1.45 }}>
          ${sections.map(
            (section) => html`
              <section key=${section.id} className="space-y-5">
                <h2 className=${classNames("text-base font-black uppercase tracking-[0.24em]", theme === "dark" ? "text-lens" : "text-sky-700")}>
                  ${section.title}
                </h2>
                <p className="whitespace-pre-wrap">${section.body || " "}</p>
              </section>
            `,
          )}
        </div>
      </div>
    </section>
  `;
}

function StudentProfileEditor({ profile, setToast }) {
  const [draft, setDraft] = useState({
    favoriteMovies: "",
    favoriteGames: "",
    favoriteMusic: "",
    careerGoals: "",
    hobbies: "",
    favoriteCreators: "",
    favoriteSports: "",
    productionInterests: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "videoStudentProfiles", profile.email),
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};
        setDraft({
          favoriteMovies: (data.favoriteMovies || []).join(", "),
          favoriteGames: (data.favoriteGames || []).join(", "),
          favoriteMusic: (data.favoriteMusic || []).join(", "),
          careerGoals: (data.careerGoals || []).join(", "),
          hobbies: (data.hobbies || []).join(", "),
          favoriteCreators: (data.favoriteCreators || []).join(", "),
          favoriteSports: (data.favoriteSports || []).join(", "),
          productionInterests: (data.productionInterests || []).join(", "),
        });
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [profile.email]);

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await setDoc(
        doc(db, "videoStudentProfiles", profile.email),
        {
          email: profile.email,
          displayName: profile.displayName,
          favoriteMovies: splitProfileList(draft.favoriteMovies),
          favoriteGames: splitProfileList(draft.favoriteGames),
          favoriteMusic: splitProfileList(draft.favoriteMusic),
          careerGoals: splitProfileList(draft.careerGoals),
          hobbies: splitProfileList(draft.hobbies),
          favoriteCreators: splitProfileList(draft.favoriteCreators),
          favoriteSports: splitProfileList(draft.favoriteSports),
          productionInterests: splitProfileList(draft.productionInterests),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setToast("Profile saved for teacher monitor");
    } catch (saveError) {
      setToast(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return html`<${EmptyState} icon=${UserCog} title="Loading profile" />`;

  const fields = [
    ["favoriteMovies", "Favorite movies"],
    ["favoriteGames", "Favorite games"],
    ["favoriteMusic", "Favorite music"],
    ["careerGoals", "Future career interests"],
    ["hobbies", "Favorite hobbies"],
    ["favoriteCreators", "Favorite creators"],
    ["favoriteSports", "Favorite sports"],
    ["productionInterests", "Personal production interests"],
  ];

  return html`
    <form onSubmit=${save} className="vp-panel rounded-3xl p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-lens">Teacher-visible profile</p>
        <h1 className="mt-1 text-2xl font-black text-white">Student Interests</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          These details rotate only on the teacher monitor board inside Video Production Studio.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        ${fields.map(
          ([field, label]) => html`
            <label key=${field} className="grid gap-1 text-sm font-bold text-slate-300">
              ${label}
              <${Textarea}
                value=${draft[field]}
                onInput=${(event) => update(field, event.currentTarget.value)}
                placeholder="Separate with commas or new lines"
                className="min-h-24"
              />
            </label>
          `,
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <${Button} icon=${Save} type="submit" disabled=${busy}>${busy ? "Saving..." : "Save profile"}</${Button}>
      </div>
    </form>
  `;
}

function UserManagement({ profile, users, loading, error, setToast }) {
  const [form, setForm] = useState({ email: "", role: VIDEO_ROLES.STUDENT });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setFormError("");
    const email = normalizeEmail(form.email);
    if (!isValidEmail(email) || !isAllowedDoralEmail(email)) {
      setFormError("Use a valid Doral email address.");
      return;
    }
    if (![VIDEO_ROLES.STUDENT, VIDEO_ROLES.TEACHER, VIDEO_ROLES.ADMIN].includes(form.role)) {
      setFormError("Choose a valid role.");
      return;
    }

    setBusy(true);
    try {
      const userRef = doc(db, "videoUsers", email);
      const existing = await getDoc(userRef);
      await setDoc(
        userRef,
        {
          email,
          role: form.role,
          active: true,
          createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
          createdBy: existing.exists() ? existing.data().createdBy : profile.email,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setForm({ email: "", role: VIDEO_ROLES.STUDENT });
      setToast("Video Production user saved");
    } catch (saveError) {
      setFormError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleUser = async (user) => {
    try {
      await updateDoc(doc(db, "videoUsers", user.email), {
        active: !user.active,
        updatedAt: serverTimestamp(),
      });
      setToast(user.active ? "User disabled" : "User enabled");
    } catch (toggleError) {
      setToast(toggleError.message);
    }
  };

  return html`
    <section className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-lens">Admin Control</p>
        <h1 className="mt-1 text-3xl font-black text-white">Video Production Users</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          These roles apply only to this production workflow.
        </p>
      </div>

      <form onSubmit=${saveUser} className="vp-panel rounded-3xl p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <${TextInput}
            value=${form.email}
            onInput=${(event) => updateForm("email", event.currentTarget.value)}
            placeholder="student@student.doralacademynv.org"
          />
          <${Select}
            value=${form.role}
            onChange=${(event) => updateForm("role", event.currentTarget.value)}
          >
            <option value=${VIDEO_ROLES.STUDENT}>Student</option>
            <option value=${VIDEO_ROLES.TEACHER}>Teacher</option>
            <option value=${VIDEO_ROLES.ADMIN}>Admin</option>
          </${Select}>
          <${Button} icon=${UserPlus} type="submit" disabled=${busy}>Add user</${Button}>
        </div>
        ${formError ? html`<p className="mt-3 rounded-xl bg-alert/10 p-3 text-sm text-red-200">${formError}</p>` : null}
      </form>

      ${error ? html`<p className="rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
      ${loading
        ? html`<${EmptyState} icon=${Users} title="Loading users" />`
        : html`
            <div className="grid gap-3">
              ${users.map(
                (user) => html`
                  <article key=${user.email} className="vp-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-white">${user.email}</p>
                      <p className="text-sm text-slate-400">${roleLabel(user.role)} - ${user.active ? "active" : "disabled"}</p>
                    </div>
                    <${Button} variant=${user.active ? "danger" : "success"} onClick=${() => toggleUser(user)}>
                      ${user.active ? "Disable" : "Enable"}
                    </${Button}>
                  </article>
                `,
              )}
            </div>
          `}
    </section>
  `;
}

function VideoProductionApp() {
  const { user, profile, loading, error } = useVideoAuthProfile();
  const [view, setView] = useState("");
  const [toast, setToast] = useState("");
  const [kioskActive, setKioskActive] = useState(false);
  const { projects, loading: projectsLoading, error: projectsError } = useVideoProjects(profile);
  const { users, loading: usersLoading, error: usersError } = useVideoUsers(isVideoAdmin(profile));
  const { profiles: studentProfiles, error: profilesError } = useVideoStudentProfiles(
    isVideoTeacher(profile) || isVideoAdmin(profile),
  );

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (profile?.role) setView(defaultViewForProfile(profile));
  }, [profile?.email, profile?.role]);

  if (loading) return html`<${LoadingScreen} />`;
  if (!user) return html`<${VideoLogin} error=${error} />`;
  if (!hasVideoAccess(profile)) return html`<${AccessDeniedScreen} profile=${profile} error=${error} />`;

  const activeView = view || defaultViewForProfile(profile);
  let content = null;

  if (activeView === "filming" && isVideoStudent(profile)) {
    content = html`
      <${StudentFilmingHome}
        profile=${profile}
        projects=${projects}
        loading=${projectsLoading}
        error=${projectsError}
        setToast=${setToast}
        setKioskActive=${setKioskActive}
      />
    `;
  } else if (activeView === "profile" && isVideoStudent(profile)) {
    content = html`<${StudentProfileEditor} profile=${profile} setToast=${setToast} />`;
  } else if (activeView === "monitor" && (isVideoTeacher(profile) || isVideoAdmin(profile))) {
    content = html`
      <${MonitorDashboard}
        projects=${projects}
        loading=${projectsLoading}
        error=${projectsError || profilesError}
        studentProfiles=${studentProfiles}
      />
    `;
  } else if (activeView === "projects" && (isVideoTeacher(profile) || isVideoAdmin(profile))) {
    content = html`
      <${ProjectManager}
        profile=${profile}
        projects=${projects}
        loading=${projectsLoading}
        error=${projectsError}
        setToast=${setToast}
      />
    `;
  } else if (activeView === "users" && isVideoAdmin(profile)) {
    content = html`
      <${UserManagement}
        profile=${profile}
        users=${users}
        loading=${usersLoading}
        error=${usersError}
        setToast=${setToast}
      />
    `;
  } else {
    content = html`
      <${EmptyState}
        icon=${ShieldCheck}
        title="Access limited"
        body="Your Video Production Studio role does not include this workspace."
      />
    `;
  }

  return html`
    <${VideoShell}
      profile=${profile}
      view=${activeView}
      setView=${setView}
      kioskActive=${kioskActive}
    >
      ${content}
    </${VideoShell}>
    <${Toast} message=${toast} />
  `;
}

createRoot(document.getElementById("video-production-root")).render(html`<${VideoProductionApp} />`);
