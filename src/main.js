import React, { useEffect, useMemo, useState } from "react";
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
  Megaphone,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
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

const ROLES = ["Teacher", "Studio Team", "Admin/Adviser"];
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

function hasStaffAccess(profile) {
  return profile?.role === "Studio Team" || profile?.role === "Admin/Adviser";
}

function hasAdminAccess(profile) {
  return profile?.role === "Admin/Adviser";
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

function useAuthProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeProfile = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      unsubscribeProfile();
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
        const profileRef = doc(db, "users", nextUser.uid);
        const profileSnap = await getDoc(profileRef);
        const sharedProfile = {
          uid: nextUser.uid,
          displayName: nextUser.displayName || nextUser.email || "Teacher",
          email: nextUser.email || "",
          photoURL: nextUser.photoURL || "",
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (!profileSnap.exists()) {
          await setDoc(profileRef, {
            ...sharedProfile,
            role: "Teacher",
            createdAt: serverTimestamp(),
          });
        } else {
          await setDoc(profileRef, sharedProfile, { merge: true });
        }

        unsubscribeProfile = onSnapshot(
          profileRef,
          (snapshot) => {
            setProfile(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
            setLoading(false);
          },
          (snapshotError) => {
            setError(snapshotError.message);
            setLoading(false);
          },
        );
      } catch (authError) {
        setError(authError.message);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeProfile();
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
    if (!profile?.uid) return undefined;
    setLoading(true);
    const announcementsRef = collection(db, "announcements");
    const request = hasStaffAccess(profile)
      ? announcementsRef
      : query(announcementsRef, where("submittedByUserId", "==", profile.uid));
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
  }, [profile?.uid, profile?.role]);

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

function useUsers(enabled) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return undefined;
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsers(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .sort((a, b) => safeText(a.displayName).localeCompare(safeText(b.displayName))),
        );
      },
      (snapshotError) => setError(snapshotError.message),
    );
    return unsubscribe;
  }, [enabled]);

  return { users, error };
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
  const nav = [
    { id: "submit", label: "Submit", icon: Send, show: true },
    { id: "mine", label: "My Status", icon: ListChecks, show: true },
    { id: "studio", label: "Studio", icon: LayoutDashboard, show: hasStaffAccess(profile) },
    { id: "rundown", label: "Rundown", icon: Clapperboard, show: hasStaffAccess(profile) },
    { id: "admin", label: "Admin", icon: UserCog, show: hasAdminAccess(profile) },
  ].filter((item) => item.show);

  useEffect(() => {
    if (!nav.some((item) => item.id === view)) setView(nav[0]?.id || "submit");
  }, [profile?.role]);

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
              <p className="truncate text-xs text-slate-500">${profile?.displayName} - ${profile?.role}</p>
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
      setError("Expiration date must be on or after the requested air date.");
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
          submittedByUserId: profile.uid,
          submittedByName: profile.displayName || profile.email || "Teacher",
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
          <${Field} label="Requested air date">
            <${TextInput}
              type="date"
              value=${form.requestedAirDate}
              onInput=${(event) => update("requestedAirDate", event.currentTarget.value)}
            />
          </${Field}>
          <${Field} label="Expiration date">
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
                            ${toDateLabel(announcement.requestedAirDate)} - ${announcement.category}
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
                        <${IconBadge} icon=${CalendarDays}>Expires ${toDateLabel(announcement.expirationDate)}</${IconBadge}>
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
      (!filters.date || item.requestedAirDate === filters.date) &&
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
                          <td className="px-4 py-4 text-slate-300">${toDateLabel(announcement.requestedAirDate)}</td>
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
            ${toDateLabel(announcement.requestedAirDate)} - ${announcement.submittedByName}
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
      item.requestedAirDate === date &&
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

function AdminPanel({ profile, taxonomy, announcements, setToast }) {
  const { users, error: usersError } = useUsers(hasAdminAccess(profile));
  const { rundowns, error: rundownsError } = useRundowns(hasAdminAccess(profile));
  const [newTaxonomy, setNewTaxonomy] = useState({ name: "", type: "category", color: "#2dd4bf" });

  const setRole = async (user, role) => {
    await updateDoc(doc(db, "users", user.id), {
      role,
      updatedAt: serverTimestamp(),
    });
    setToast(`${user.displayName || user.email} is now ${role}`);
  };

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
      ${usersError || rundownsError
        ? html`<p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">${usersError || rundownsError}</p>`
        : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 p-4">
            <h3 className="font-black text-white">Users</h3>
          </div>
          <div className="divide-y divide-slate-800/80">
            ${users.map(
              (user) => html`
                <div key=${user.id} className="grid gap-3 p-4 md:grid-cols-[1fr_220px] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">${user.displayName || "Unnamed user"}</p>
                    <p className="truncate text-sm text-slate-400">${user.email}</p>
                  </div>
                  <${Select} value=${user.role} onChange=${(event) => setRole(user, event.currentTarget.value)}>
                    ${ROLES.map((role) => html`<option key=${role} value=${role}>${role}</option>`)}
                  </${Select}>
                </div>
              `,
            )}
          </div>
        </div>

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

function App() {
  const { user, profile, loading, error } = useAuthProfile();
  const taxonomy = useTaxonomy(Boolean(profile?.uid));
  const [view, setView] = useState("submit");
  const [toast, setToast] = useState("");
  const { announcements } = useAnnouncements(profile);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (loading) return html`<${LoadingScreen} />`;
  if (!user) return html`<${LoginScreen} error=${error} />`;

  let content = null;
  if (view === "submit") {
    content = html`
      <${SubmissionForm}
        profile=${profile}
        taxonomy=${taxonomy}
        setToast=${setToast}
      />
    `;
  } else if (view === "mine") {
    content = html`<${TeacherStatus} profile=${profile} taxonomy=${taxonomy} setToast=${setToast} />`;
  } else if (view === "studio" && hasStaffAccess(profile)) {
    content = html`<${StudioDashboard} profile=${profile} setToast=${setToast} />`;
  } else if (view === "rundown" && hasStaffAccess(profile)) {
    content = html`<${RundownBuilder} profile=${profile} setToast=${setToast} />`;
  } else if (view === "admin" && hasAdminAccess(profile)) {
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
    <${AppShell} profile=${profile} taxonomy=${taxonomy} view=${view} setView=${setView}>
      ${content}
    </${AppShell}>
    <${Toast} message=${toast} />
  `;
}

createRoot(document.getElementById("root")).render(html`<${App} />`);
