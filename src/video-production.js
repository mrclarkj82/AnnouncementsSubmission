import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { html } from "htm/react";
import {
  Activity,
  AlertTriangle,
  Archive,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Clock,
  Copy,
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
  RefreshCcw,
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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
const PERIOD_SESSION_KEY = "videoStudio.selectedMonitorPeriodId";
const DCC_OWNER_EMAIL = "joseph.clark@doralacademynv.org";

const DEMO_PERIODS = [
  {
    number: 1,
    periodName: "Period 1",
    courseName: "Video Production I",
    students: [
      "Alex Morgan",
      "Jordan Lee",
      "Taylor Brooks",
      "Casey Rivera",
      "Morgan Patel",
      "Riley Chen",
      "Avery Johnson",
      "Cameron Davis",
      "Sam Quinn",
      "Jamie Torres",
    ],
  },
  {
    number: 2,
    periodName: "Period 2",
    courseName: "Video Production I",
    students: [
      "Parker Stone",
      "Reese Martin",
      "Drew Bennett",
      "Skyler Adams",
      "Kendall Price",
      "Rowan Mitchell",
      "Hayden Reed",
      "Emerson Clark",
      "Finley Garcia",
      "Quinn Sanders",
    ],
  },
  {
    number: 3,
    periodName: "Period 3",
    courseName: "Advanced Video Production",
    students: [
      "Harper Wilson",
      "Logan Hayes",
      "Maya Collins",
      "Elliot Ramirez",
      "Nico Foster",
      "Sage Coleman",
      "Blake Nguyen",
      "Jules Parker",
      "Marley Cooper",
      "Tatum Gray",
    ],
  },
  {
    number: 4,
    periodName: "Period 4",
    courseName: "Broadcast Studio",
    students: [
      "Charlie Moore",
      "Dakota King",
      "Robin Scott",
      "Kai Thompson",
      "Sydney Flores",
      "Remy Hughes",
      "Micah Ward",
      "Lennon Bailey",
      "Phoenix Ross",
      "Shawn Murphy",
    ],
  },
];

const DCC_ROSTER_BATCH = "dcc-practice-roster-2026";
const DCC_PERIODS = [
  {
    number: 1,
    periodName: "DCC - Period 1",
    courseName: "DCC",
    preferredJoinCode: "DCC-P1-4827",
    students: [
      ["Ava Martinez", "ava.martinez.dccp1@student.doralacademynv.org"],
      ["Ethan Brooks", "ethan.brooks.dccp1@student.doralacademynv.org"],
      ["Mia Johnson", "mia.johnson.dccp1@student.doralacademynv.org"],
      ["Liam Carter", "liam.carter.dccp1@student.doralacademynv.org"],
      ["Sophia Nguyen", "sophia.nguyen.dccp1@student.doralacademynv.org"],
      ["Noah Bennett", "noah.bennett.dccp1@student.doralacademynv.org"],
      ["Isabella Rivera", "isabella.rivera.dccp1@student.doralacademynv.org"],
      ["Lucas Thompson", "lucas.thompson.dccp1@student.doralacademynv.org"],
      ["Emma Rodriguez", "emma.rodriguez.dccp1@student.doralacademynv.org"],
      ["Mason Clark", "mason.clark.dccp1@student.doralacademynv.org"],
      ["Olivia Parker", "olivia.parker.dccp1@student.doralacademynv.org"],
      ["Logan Phillips", "logan.phillips.dccp1@student.doralacademynv.org"],
      ["Amelia Foster", "amelia.foster.dccp1@student.doralacademynv.org"],
      ["Jackson Reed", "jackson.reed.dccp1@student.doralacademynv.org"],
      ["Harper Collins", "harper.collins.dccp1@student.doralacademynv.org"],
      ["Aiden Murphy", "aiden.murphy.dccp1@student.doralacademynv.org"],
      ["Evelyn Sanders", "evelyn.sanders.dccp1@student.doralacademynv.org"],
      ["Caleb Morgan", "caleb.morgan.dccp1@student.doralacademynv.org"],
      ["Abigail Cooper", "abigail.cooper.dccp1@student.doralacademynv.org"],
      ["Grayson Bell", "grayson.bell.dccp1@student.doralacademynv.org"],
      ["Ella Ward", "ella.ward.dccp1@student.doralacademynv.org"],
      ["Daniel Hayes", "daniel.hayes.dccp1@student.doralacademynv.org"],
      ["Scarlett Powell", "scarlett.powell.dccp1@student.doralacademynv.org"],
      ["Wyatt Bryant", "wyatt.bryant.dccp1@student.doralacademynv.org"],
      ["Chloe Jenkins", "chloe.jenkins.dccp1@student.doralacademynv.org"],
      ["Carter Simmons", "carter.simmons.dccp1@student.doralacademynv.org"],
      ["Lily Coleman", "lily.coleman.dccp1@student.doralacademynv.org"],
      ["Owen Russell", "owen.russell.dccp1@student.doralacademynv.org"],
      ["Grace Perry", "grace.perry.dccp1@student.doralacademynv.org"],
      ["Henry Price", "henry.price.dccp1@student.doralacademynv.org"],
    ],
  },
  {
    number: 2,
    periodName: "DCC - Period 2",
    courseName: "DCC",
    preferredJoinCode: "DCC-P2-6394",
    students: [
      ["Zoey Anderson", "zoey.anderson.dccp2@student.doralacademynv.org"],
      ["James Mitchell", "james.mitchell.dccp2@student.doralacademynv.org"],
      ["Nora Sullivan", "nora.sullivan.dccp2@student.doralacademynv.org"],
      ["Benjamin Torres", "benjamin.torres.dccp2@student.doralacademynv.org"],
      ["Avery Ramirez", "avery.ramirez.dccp2@student.doralacademynv.org"],
      ["Elijah Peterson", "elijah.peterson.dccp2@student.doralacademynv.org"],
      ["Riley Flores", "riley.flores.dccp2@student.doralacademynv.org"],
      ["Samuel Griffin", "samuel.griffin.dccp2@student.doralacademynv.org"],
      ["Layla Hughes", "layla.hughes.dccp2@student.doralacademynv.org"],
      ["Jacob Russell", "jacob.russell.dccp2@student.doralacademynv.org"],
      ["Aria Diaz", "aria.diaz.dccp2@student.doralacademynv.org"],
      ["Michael Jenkins", "michael.jenkins.dccp2@student.doralacademynv.org"],
      ["Penelope Cook", "penelope.cook.dccp2@student.doralacademynv.org"],
      ["Sebastian Cox", "sebastian.cox.dccp2@student.doralacademynv.org"],
      ["Hannah Bell", "hannah.bell.dccp2@student.doralacademynv.org"],
      ["Levi Alexander", "levi.alexander.dccp2@student.doralacademynv.org"],
      ["Stella Butler", "stella.butler.dccp2@student.doralacademynv.org"],
      ["Gabriel Wood", "gabriel.wood.dccp2@student.doralacademynv.org"],
      ["Addison Kelly", "addison.kelly.dccp2@student.doralacademynv.org"],
      ["Julian Brooks", "julian.brooks.dccp2@student.doralacademynv.org"],
      ["Victoria Nelson", "victoria.nelson.dccp2@student.doralacademynv.org"],
      ["Isaac Gray", "isaac.gray.dccp2@student.doralacademynv.org"],
      ["Natalie Rivera", "natalie.rivera.dccp2@student.doralacademynv.org"],
      ["Anthony Bennett", "anthony.bennett.dccp2@student.doralacademynv.org"],
      ["Leah Stewart", "leah.stewart.dccp2@student.doralacademynv.org"],
      ["Christopher Young", "christopher.young.dccp2@student.doralacademynv.org"],
      ["Brooklyn Murphy", "brooklyn.murphy.dccp2@student.doralacademynv.org"],
      ["Joshua Foster", "joshua.foster.dccp2@student.doralacademynv.org"],
      ["Audrey Perez", "audrey.perez.dccp2@student.doralacademynv.org"],
      ["Andrew Collins", "andrew.collins.dccp2@student.doralacademynv.org"],
    ],
  },
  {
    number: 3,
    periodName: "DCC - Period 3",
    courseName: "DCC",
    preferredJoinCode: "DCC-P3-7158",
    students: [
      ["Madison Bryant", "madison.bryant.dccp3@student.doralacademynv.org"],
      ["Dylan Ramirez", "dylan.ramirez.dccp3@student.doralacademynv.org"],
      ["Savannah Morgan", "savannah.morgan.dccp3@student.doralacademynv.org"],
      ["Nathan Ross", "nathan.ross.dccp3@student.doralacademynv.org"],
      ["Skylar Bailey", "skylar.bailey.dccp3@student.doralacademynv.org"],
      ["Christian Coleman", "christian.coleman.dccp3@student.doralacademynv.org"],
      ["Lucy Henderson", "lucy.henderson.dccp3@student.doralacademynv.org"],
      ["Jonathan Reed", "jonathan.reed.dccp3@student.doralacademynv.org"],
      ["Claire Patterson", "claire.patterson.dccp3@student.doralacademynv.org"],
      ["Cameron Watson", "cameron.watson.dccp3@student.doralacademynv.org"],
      ["Paisley Simmons", "paisley.simmons.dccp3@student.doralacademynv.org"],
      ["Thomas Ward", "thomas.ward.dccp3@student.doralacademynv.org"],
      ["Ellie Barnes", "ellie.barnes.dccp3@student.doralacademynv.org"],
      ["Aaron Powell", "aaron.powell.dccp3@student.doralacademynv.org"],
      ["Violet Long", "violet.long.dccp3@student.doralacademynv.org"],
      ["Connor Perry", "connor.perry.dccp3@student.doralacademynv.org"],
      ["Mila Edwards", "mila.edwards.dccp3@student.doralacademynv.org"],
      ["Ryan Butler", "ryan.butler.dccp3@student.doralacademynv.org"],
      ["Hazel Flores", "hazel.flores.dccp3@student.doralacademynv.org"],
      ["Luke Simmons", "luke.simmons.dccp3@student.doralacademynv.org"],
      ["Elena Brooks", "elena.brooks.dccp3@student.doralacademynv.org"],
      ["Hunter Stewart", "hunter.stewart.dccp3@student.doralacademynv.org"],
      ["Maya Price", "maya.price.dccp3@student.doralacademynv.org"],
      ["Jeremiah Cox", "jeremiah.cox.dccp3@student.doralacademynv.org"],
      ["Sophie Kelly", "sophie.kelly.dccp3@student.doralacademynv.org"],
      ["Adrian Gray", "adrian.gray.dccp3@student.doralacademynv.org"],
      ["Bella Hughes", "bella.hughes.dccp3@student.doralacademynv.org"],
      ["Nicholas Peterson", "nicholas.peterson.dccp3@student.doralacademynv.org"],
      ["Kennedy Cook", "kennedy.cook.dccp3@student.doralacademynv.org"],
      ["Easton Torres", "easton.torres.dccp3@student.doralacademynv.org"],
    ],
  },
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

function safeFirestoreId(value) {
  return safeText(value).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "demo";
}

function titleFromEmail(email) {
  const name = normalizeEmail(email).split("@")[0] || "student";
  return name
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugFromName(name) {
  return safeText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function demoOwnerKey(profile) {
  return safeFirestoreId(profile?.uid || normalizeEmail(profile?.email) || "teacher").toLowerCase();
}

function demoPeriodId(profile, demoPeriod) {
  return `demo-${demoOwnerKey(profile)}-period-${demoPeriod.number}`;
}

function demoJoinCode(profile, demoPeriod) {
  return `DEMO-${demoOwnerKey(profile).slice(0, 6).toUpperCase()}-P${demoPeriod.number}`;
}

function demoStudentEmail(name, demoPeriod) {
  return `${slugFromName(name)}.p${demoPeriod.number}.demo${DORAL_STUDENT_DOMAIN}`;
}

function dccPeriodId(periodNumber) {
  return `${DCC_ROSTER_BATCH}-p${periodNumber}`;
}

function dccSeededStudentId(periodNumber, index) {
  return `dcc-p${periodNumber}-student-${String(index + 1).padStart(3, "0")}`;
}

function isDccRosterOwner(profile) {
  return normalizeEmail(profile?.email) === DCC_OWNER_EMAIL;
}

async function resolveDccJoinCode(dccPeriod) {
  const preferredCode = normalizeJoinCode(dccPeriod.preferredJoinCode);
  const preferredSnapshot = await getDoc(doc(db, "periodJoinCodes", joinCodeLowercase(preferredCode)));
  const periodId = dccPeriodId(dccPeriod.number);
  if (!preferredSnapshot.exists() || preferredSnapshot.data().periodId === periodId) return preferredCode;

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const joinCode = `DCC-P${dccPeriod.number}-${Math.floor(1000 + Math.random() * 9000)}`;
    const codeSnapshot = await getDoc(doc(db, "periodJoinCodes", joinCodeLowercase(joinCode)));
    if (!codeSnapshot.exists()) return joinCode;
  }
  throw new Error(`Could not generate an available DCC Period ${dccPeriod.number} join code.`);
}

function isPeriodArchived(period) {
  return Boolean(period?.archived || period?.isArchived || period?.status === "archived");
}

function normalizePeriodArchiveState(period) {
  const archived = isPeriodArchived(period);
  return {
    archived,
    active: archived ? false : period?.active !== false,
    archivedAt: period?.archivedAt || "",
    archivedBy: safeText(period?.archivedBy),
  };
}

function getActivePeriods(periods = []) {
  return periods.filter((period) => period.active !== false && !isPeriodArchived(period));
}

function getArchivedPeriods(periods = []) {
  return periods.filter((period) => isPeriodArchived(period));
}

function normalizeJoinCode(code) {
  return safeText(code).toUpperCase().replace(/\s+/g, "");
}

function joinCodeLowercase(code) {
  return normalizeJoinCode(code).toLowerCase();
}

function joinCodePrefix(periodName, courseName) {
  const source = safeText(courseName) || safeText(periodName) || "CLASS";
  const compact = source
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => (/^\d+$/.test(part) ? `P${part}` : part.slice(0, 3)))
    .join("");
  return (compact || "CLASS").slice(0, 8);
}

function generateJoinCodeCandidate(periodName, courseName) {
  const prefix = joinCodePrefix(periodName, courseName);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

async function createUniqueJoinCode(periodName, courseName) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const joinCode = generateJoinCodeCandidate(periodName, courseName);
    const codeSnapshot = await getDoc(doc(db, "periodJoinCodes", joinCodeLowercase(joinCode)));
    if (!codeSnapshot.exists()) return joinCode;
  }
  throw new Error("Could not generate a unique period code. Try again.");
}

async function copyText(value, label, setToast) {
  try {
    await navigator.clipboard.writeText(value);
    setToast(`${label} copied`);
  } catch {
    setToast(`Copy failed. Code: ${value}`);
  }
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

function normalizeGroupItems(groups) {
  return Array.isArray(groups)
    ? groups.map((group, index) => {
        const assignedStudentEmails = Array.isArray(group.assignedStudentEmails)
          ? group.assignedStudentEmails.map(normalizeEmail).filter(Boolean)
          : splitEmails(group.assignedStudents || "");
        return {
          id: group.id || makeId("group"),
          name: safeText(group.name) || `Group ${index + 1}`,
          assignedStudentEmails,
          assignedStudentNames: assignedStudentEmails.map(titleFromEmail),
        };
      })
    : [];
}

function normalizeProjectGroups(groups, fallbackEmails = [], fallbackName = "Group 1") {
  const normalizedGroups = normalizeGroupItems(groups);
  if (normalizedGroups.length) return normalizedGroups;

  const assignedStudentEmails = fallbackEmails.map(normalizeEmail).filter(Boolean);
  return [
    {
      id: makeId("group"),
      name: safeText(fallbackName) || "Group 1",
      assignedStudentEmails,
      assignedStudentNames: assignedStudentEmails.map(titleFromEmail),
    },
  ];
}

function normalizeProjectPeriodIds(project) {
  const ids = Array.isArray(project?.periodIds)
    ? project.periodIds
    : project?.periodId
      ? [project.periodId]
      : [];
  return [...new Set(ids.map(safeText).filter(Boolean))];
}

function projectBelongsToPeriod(project, periodId) {
  return normalizeProjectPeriodIds(project).includes(safeText(periodId));
}

function projectPeriodSummaries(project, periods = []) {
  const periodMap = new Map(periods.map((period) => [period.id, period]));
  const savedSummaryMap = new Map(
    (Array.isArray(project?.periodSummaries) ? project.periodSummaries : [])
      .map((summary) => [summary.id, summary]),
  );
  return normalizeProjectPeriodIds(project).map((periodId, index) => {
    const period = periodMap.get(periodId);
    const savedSummary = savedSummaryMap.get(periodId);
    return {
      id: periodId,
      periodName:
        period?.periodName ||
        savedSummary?.periodName ||
        (periodId === project?.periodId ? project?.periodName : "") ||
        "Deleted period",
      courseName:
        period?.courseName ||
        savedSummary?.courseName ||
        (periodId === project?.periodId ? project?.courseName : "") ||
        "",
    };
  });
}

function periodSummaryLabel(summary) {
  return `${summary.periodName}${summary.courseName ? ` - ${summary.courseName}` : ""}`;
}

function projectPeriodLabel(project, periods = []) {
  const summaries = projectPeriodSummaries(project, periods);
  if (!summaries.length) return "No periods";
  if (summaries.length === 1) return periodSummaryLabel(summaries[0]);
  return summaries.map(periodSummaryLabel).join(", ");
}

function normalizeGroupsByPeriod(project) {
  const ids = normalizeProjectPeriodIds(project);
  const source =
    project?.groupsByPeriod && typeof project.groupsByPeriod === "object"
      ? project.groupsByPeriod
      : {};
  return ids.reduce((groupsByPeriod, periodId) => {
    if (Array.isArray(source[periodId])) {
      groupsByPeriod[periodId] = normalizeGroupItems(source[periodId]);
    } else if (periodId === project?.periodId) {
      groupsByPeriod[periodId] = normalizeProjectGroups(
        project?.groups,
        project?.assignedStudentEmails || [],
        project?.groupName || "Group 1",
      );
    } else {
      groupsByPeriod[periodId] = [];
    }
    return groupsByPeriod;
  }, {});
}

function groupStudentEmailsByPeriod(groupsByPeriod) {
  return [
    ...new Set(
      Object.values(groupsByPeriod || {})
        .flatMap((groups) => normalizeGroupItems(groups))
        .flatMap((group) => group.assignedStudentEmails)
        .map(normalizeEmail)
        .filter(Boolean),
    ),
  ];
}

function groupStudentEmails(groups) {
  return [
    ...new Set(
      normalizeProjectGroups(groups)
        .flatMap((group) => group.assignedStudentEmails)
        .map(normalizeEmail)
        .filter(Boolean),
    ),
  ];
}

function projectGroupLabel(project) {
  const groups = normalizeProjectGroups(
    project?.groups,
    project?.assignedStudentEmails || [],
    project?.groupName || "Production Group",
  );
  if (groups.length === 1) return groups[0].name;
  return `${groups.length} groups`;
}

function newGroupDraft(index = 1) {
  return {
    id: makeId("group"),
    name: `Group ${index}`,
    assignedStudents: "",
  };
}

function projectGroupDrafts(project) {
  return normalizeProjectGroups(
    project?.groups,
    project?.assignedStudentEmails || [],
    project?.groupName || "Group 1",
  ).map((group) => ({
    id: group.id || makeId("group"),
    name: group.name,
    assignedStudents: group.assignedStudentEmails.join(", "),
  }));
}

function serializeGroupDrafts(groupDrafts) {
  return (Array.isArray(groupDrafts) && groupDrafts.length ? groupDrafts : [newGroupDraft(1)]).map(
    (group, index) => {
      const assignedStudentEmails = splitEmails(group.assignedStudents || "");
      return {
        id: group.id || makeId("group"),
        name: safeText(group.name) || `Group ${index + 1}`,
        assignedStudentEmails,
        assignedStudentNames: assignedStudentEmails.map(titleFromEmail),
      };
    },
  );
}

function cleanProject(project) {
  const periodIds = normalizeProjectPeriodIds(project);
  const fallbackEmails = Array.isArray(project?.assignedStudentEmails)
    ? project.assignedStudentEmails.map(normalizeEmail).filter(Boolean)
    : [];
  const groupsByPeriod = normalizeGroupsByPeriod({
    ...project,
    periodIds: periodIds.length ? periodIds : project?.periodId ? [project.periodId] : [],
  });
  const groups = normalizeProjectGroups(
    project?.groups,
    fallbackEmails,
    project?.groupName || "Production Group",
  );
  const assignedStudentEmails = [
    ...new Set([
      ...fallbackEmails,
      ...groups.flatMap((group) => group.assignedStudentEmails),
      ...groupStudentEmailsByPeriod(groupsByPeriod),
    ]),
  ];
  return {
    ...project,
    periodId: safeText(project?.periodId),
    periodIds,
    periodName: safeText(project?.periodName),
    courseName: safeText(project?.courseName),
    groups,
    groupsByPeriod,
    checklistItems: normalizeChecklist(project?.checklistItems || []),
    scriptSections: normalizeScriptSections(project?.scriptSections || []),
    shotList: normalizeShots(project?.shotList || []),
    assignedStudentEmails,
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

function cleanPeriod(period) {
  const archiveState = normalizePeriodArchiveState(period);
  return {
    ...period,
    periodName: safeText(period?.periodName) || "Untitled Period",
    courseName: safeText(period?.courseName),
    joinCode: normalizeJoinCode(period?.joinCode),
    joinCodeLowercase: joinCodeLowercase(period?.joinCode || period?.joinCodeLowercase),
    ...archiveState,
  };
}

function canonicalEnrollmentId(periodId, studentEmail) {
  return `${safeText(periodId)}_${normalizeEmail(studentEmail)}`;
}

function activeEnrollmentsForPeriod(enrollments, periodId) {
  const seen = new Set();
  return enrollments
    .filter((enrollment) => enrollment.active !== false && enrollment.periodId === periodId)
    .filter((enrollment) => {
      const key = normalizeEmail(enrollment.studentEmail || enrollment.studentId || enrollment.id);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) =>
      safeText(a.studentName || titleFromEmail(a.studentEmail)).localeCompare(
        safeText(b.studentName || titleFromEmail(b.studentEmail)),
      ),
    );
}

function studentsForPeriod(enrollments, periodId) {
  return activeEnrollmentsForPeriod(enrollments, periodId).map((enrollment) => ({
    email: normalizeEmail(enrollment.studentEmail),
    name: safeText(enrollment.studentName) || titleFromEmail(enrollment.studentEmail),
  }));
}

function usePeriods(profile, enrollments = []) {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const studentPeriodIds = useMemo(
    () => [
      ...new Set(
        enrollments
          .filter((enrollment) => enrollment.active !== false)
          .map((enrollment) => safeText(enrollment.periodId))
          .filter(Boolean),
      ),
    ],
    [enrollments],
  );

  useEffect(() => {
    if (!isVideoAdmin(profile) && !isVideoTeacher(profile) && !isVideoStudent(profile)) {
      setPeriods([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    if (isVideoStudent(profile) && !studentPeriodIds.length) {
      setPeriods([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    const periodsRef = collection(db, "periods");
    if (isVideoStudent(profile)) {
      const periodMap = new Map();
      const syncPeriods = () => {
        setPeriods(
          [...periodMap.values()].sort((a, b) =>
            safeText(a.courseName).localeCompare(safeText(b.courseName)) ||
            safeText(a.periodName).localeCompare(safeText(b.periodName)),
          ),
        );
        setError("");
        setLoading(false);
      };
      const unsubscribes = studentPeriodIds.map((periodId) =>
        onSnapshot(
          doc(db, "periods", periodId),
          (snapshot) => {
            if (snapshot.exists()) periodMap.set(periodId, cleanPeriod({ id: snapshot.id, ...snapshot.data() }));
            else periodMap.delete(periodId);
            syncPeriods();
          },
          (snapshotError) => {
            setError(snapshotError.message);
            setLoading(false);
          },
        ),
      );

      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }

    const request = isVideoAdmin(profile) ? periodsRef : query(periodsRef, where("teacherId", "==", profile.uid));

    const unsubscribe = onSnapshot(
      request,
      (snapshot) => {
        setPeriods(
          snapshot.docs
            .map((item) => cleanPeriod({ id: item.id, ...item.data() }))
            .sort((a, b) => {
              const activeA = getActivePeriods([a]).length ? 0 : 1;
              const activeB = getActivePeriods([b]).length ? 0 : 1;
              return (
                activeA - activeB ||
                safeText(a.courseName).localeCompare(safeText(b.courseName)) ||
                safeText(a.periodName).localeCompare(safeText(b.periodName))
              );
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
  }, [profile?.email, profile?.role, profile?.uid, studentPeriodIds.join("|")]);

  return { periods, loading, error };
}

function usePeriodEnrollments(profile) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasVideoAccess(profile)) {
      setEnrollments([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    const enrollmentsRef = collection(db, "periodEnrollments");
    const request = isVideoAdmin(profile)
      ? enrollmentsRef
      : isVideoTeacher(profile)
        ? query(enrollmentsRef, where("teacherId", "==", profile.uid))
        : query(enrollmentsRef, where("studentEmail", "==", profile.email));

    const unsubscribe = onSnapshot(
      request,
      (snapshot) => {
        setEnrollments(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .sort((a, b) =>
              safeText(a.periodName).localeCompare(safeText(b.periodName)) ||
              safeText(a.studentName).localeCompare(safeText(b.studentName)),
            ),
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
  }, [profile?.email, profile?.role, profile?.uid]);

  return { enrollments, loading, error };
}

function useVideoProjects(profile, enrollments = [], periods = []) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activePeriodIds = useMemo(() => new Set(getActivePeriods(periods).map((period) => period.id)), [periods]);
  const studentPeriodIds = useMemo(
    () => [
      ...new Set(
        enrollments
          .filter((enrollment) => enrollment.active !== false)
          .map((enrollment) => safeText(enrollment.periodId))
          .filter((periodId) => activePeriodIds.has(periodId))
          .filter(Boolean),
      ),
    ],
    [enrollments, periods, activePeriodIds],
  );

  useEffect(() => {
    if (!hasVideoAccess(profile)) {
      setProjects([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    const projectsRef = collection(db, "videoProjects");

    if (isVideoStudent(profile)) {
      if (!studentPeriodIds.length) {
        setProjects([]);
        setLoading(false);
        setError("");
        return undefined;
      }

      const buckets = new Map();
      const updateStudentProjects = () => {
        const deduped = new Map();
        [...buckets.values()]
          .flat()
          .forEach((project) => deduped.set(project.id, project));
        setProjects(
          [...deduped.values()].sort((a, b) => {
            const activeA = a.status === "active" ? 0 : 1;
            const activeB = b.status === "active" ? 0 : 1;
            return activeA - activeB || safeText(a.dueDate).localeCompare(safeText(b.dueDate));
          }),
        );
      };
      const unsubscribes = studentPeriodIds.flatMap((periodId) => [
        onSnapshot(
          query(projectsRef, where("periodId", "==", periodId)),
          (snapshot) => {
            buckets.set(
              `legacy-${periodId}`,
              snapshot.docs.map((item) => cleanProject({ id: item.id, ...item.data() })),
            );
            updateStudentProjects();
            setError("");
            setLoading(false);
          },
          (snapshotError) => {
            setError(snapshotError.message);
            setLoading(false);
          },
        ),
        onSnapshot(
          query(projectsRef, where("periodIds", "array-contains", periodId)),
          (snapshot) => {
            buckets.set(
              `multi-${periodId}`,
              snapshot.docs.map((item) => cleanProject({ id: item.id, ...item.data() })),
            );
            updateStudentProjects();
            setError("");
            setLoading(false);
          },
          (snapshotError) => {
            setError(snapshotError.message);
            setLoading(false);
          },
        ),
      ]);

      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }

    const request = isVideoAdmin(profile)
      ? projectsRef
      : query(projectsRef, where("assignedTeacherEmail", "==", profile.email));

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
  }, [profile?.email, profile?.role, studentPeriodIds.join("|")]);

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
    { id: "periods", label: "Periods", icon: LayoutGrid, show: isVideoTeacher(profile) || isVideoAdmin(profile) },
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

function MonitorDashboard({
  projects,
  loading,
  error,
  studentProfiles,
  periods,
  enrollments,
  selectedPeriodId,
  setSelectedPeriodId,
  onPreviewPeriod,
}) {
  const [interestIndex, setInterestIndex] = useState(0);
  const activePeriods = getActivePeriods(periods);
  const selectedPeriod = activePeriods.find((period) => period.id === selectedPeriodId);
  const activeProjects = projects
    .filter((project) => project.status !== "archived")
    .filter((project) => !selectedPeriodId || projectBelongsToPeriod(project, selectedPeriodId));
  const selectedEnrollments = activeEnrollmentsForPeriod(enrollments, selectedPeriodId);
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
          ${selectedPeriod ? html`<${Badge} icon=${LayoutGrid}>${selectedPeriod.periodName}</${Badge}>` : null}
          <${Badge} icon=${Clock}>Live Firestore updates</${Badge}>
        </div>
      </div>

      ${error ? html`<p className="rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}

      <div className="vp-panel rounded-3xl p-4">
        <label className="grid gap-2 text-sm font-bold text-slate-300 md:max-w-xl">
          Select period to monitor
          <${Select}
            value=${selectedPeriodId}
            onChange=${(event) => setSelectedPeriodId(event.currentTarget.value)}
          >
            <option value="">Select Period</option>
            ${activePeriods.map(
              (period) => html`
                <option key=${period.id} value=${period.id}>
                  ${period.periodName}${period.courseName ? ` - ${period.courseName}` : ""}
                </option>
              `,
            )}
          </${Select}>
        </label>
        ${selectedPeriod
          ? html`
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  Showing ${selectedEnrollments.length} enrolled student${selectedEnrollments.length === 1 ? "" : "s"}
                  and ${activeProjects.length} active project${activeProjects.length === 1 ? "" : "s"} for
                  <span className="font-black text-white">${selectedPeriod.periodName}</span>.
                </p>
                <button
                  type="button"
                  aria-label=${`Preview ${selectedPeriod.periodName} as student`}
                  title=${`Preview ${selectedPeriod.periodName} as student`}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lens ring-1 ring-lens/30 transition hover:bg-slate-800"
                  onClick=${() => onPreviewPeriod(selectedPeriod.id)}
                >
                  <${Eye} size=${18} />
                </button>
              </div>
            `
          : html`<p className="mt-3 text-sm text-slate-400">Choose a period to show only that class.</p>`}
      </div>

      ${loading
        ? html`<${EmptyState} icon=${Activity} title="Loading live projects" />`
        : !selectedPeriodId
          ? html`<${EmptyState} icon=${LayoutGrid} title="Select a period" body="The monitor now shows one class period at a time." />`
          : activeProjects.length === 0
            ? html`<${EmptyState} icon=${Monitor} title="No active filming sessions" body="Create a project for this period to see live progress here." />`
          : html`
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                ${activeProjects.map(
                  (project) => html`
                    <${ProjectMonitorCard}
                      key=${project.id}
                      project=${project}
                      enrollments=${selectedEnrollments}
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

function ProjectMonitorCard({ project, enrollments, profileByEmail, interestIndex }) {
  const progress = projectProgress(project);
  const periodStudentEmails = enrollments.map((enrollment) => normalizeEmail(enrollment.studentEmail)).filter(Boolean);
  const students = periodStudentEmails.length
    ? periodStudentEmails
    : project.assignedStudentEmails?.length
      ? project.assignedStudentEmails
      : [];
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
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">${projectGroupLabel(project)}</p>
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

function PeriodManager({ profile, periods, enrollments, projects, loading, error, setToast }) {
  const [seedBusy, setSeedBusy] = useState(false);
  const [dccBusy, setDccBusy] = useState("");
  const [dccConfirm, setDccConfirm] = useState("");
  const [dccAutoSeeded, setDccAutoSeeded] = useState(false);
  const [seedSummary, setSeedSummary] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const activePeriods = getActivePeriods(periods);
  const archivedPeriods = getArchivedPeriods(periods);
  const dccSeededPeriods = periods.filter((period) => period.seededRosterBatch === DCC_ROSTER_BATCH);
  const dccRosterReady = DCC_PERIODS.every((dccPeriod) =>
    dccSeededPeriods.some(
      (period) =>
        period.id === dccPeriodId(dccPeriod.number) &&
        period.active !== false &&
        !isPeriodArchived(period),
    ),
  );

  const seedDccPracticeRoster = async () => {
    const totalStudents = DCC_PERIODS.reduce((total, period) => total + period.students.length, 0);
    if (!isDccRosterOwner(profile)) {
      setToast(`Sign in as ${DCC_OWNER_EMAIL} to create this DCC roster.`);
      return;
    }

    setDccBusy("seed");
    setSeedSummary("");
    try {
      let availablePeriods = 0;
      let createdPeriods = 0;
      let restoredPeriods = 0;
      let availableStudents = 0;
      let createdStudents = 0;
      let restoredStudents = 0;

      for (const dccPeriod of DCC_PERIODS) {
        const periodId = dccPeriodId(dccPeriod.number);
        const periodRef = doc(db, "periods", periodId);
        const periodSnapshot = await getDoc(periodRef);
        let joinCode = "";
        if (periodSnapshot.exists()) joinCode = normalizeJoinCode(periodSnapshot.data().joinCode);
        if (!joinCode) joinCode = await resolveDccJoinCode(dccPeriod);
        const joinCodeKey = joinCodeLowercase(joinCode);
        const periodPayload = {
          periodId,
          name: dccPeriod.periodName,
          className: dccPeriod.courseName,
          periodNumber: dccPeriod.number,
          teacherId: profile.uid,
          teacherEmail: profile.email,
          teacherName: profile.displayName,
          periodName: dccPeriod.periodName,
          courseName: dccPeriod.courseName,
          joinCode,
          joinCodeLowercase: joinCodeKey,
          active: true,
          archived: false,
          archivedAt: "",
          archivedBy: "",
          seededRoster: true,
          seededRosterBatch: DCC_ROSTER_BATCH,
          createdBySeedScript: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (periodSnapshot.exists()) {
          const existingPeriod = periodSnapshot.data();
          if (existingPeriod.seededRosterBatch !== DCC_ROSTER_BATCH) {
            throw new Error(`${periodId} already exists and is not part of the DCC practice roster.`);
          }
          await updateDoc(periodRef, {
            active: true,
            archived: false,
            archivedAt: "",
            archivedBy: "",
            updatedAt: serverTimestamp(),
          });
          availablePeriods += 1;
          if (existingPeriod.archived === true || existingPeriod.active === false) restoredPeriods += 1;
        } else {
          await setDoc(periodRef, periodPayload);
          createdPeriods += 1;
        }

        await setDoc(
          doc(db, "periodJoinCodes", joinCodeKey),
          {
            periodId,
            teacherId: profile.uid,
            teacherEmail: profile.email,
            teacherName: profile.displayName,
            periodName: dccPeriod.periodName,
            courseName: dccPeriod.courseName,
            joinCode,
            joinCodeLowercase: joinCodeKey,
            active: true,
            seededRoster: true,
            seededRosterBatch: DCC_ROSTER_BATCH,
            createdBySeedScript: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        for (const [studentIndex, student] of dccPeriod.students.entries()) {
          const [studentName, rawStudentEmail] = student;
          const studentEmail = normalizeEmail(rawStudentEmail);
          const enrollmentId = canonicalEnrollmentId(periodId, studentEmail);
          const enrollmentRef = doc(db, "periodEnrollments", enrollmentId);
          const enrollmentSnapshot = await getDoc(enrollmentRef);
          const enrollmentPayload = {
            enrollmentId,
            studentId: dccSeededStudentId(dccPeriod.number, studentIndex),
            seededStudentId: dccSeededStudentId(dccPeriod.number, studentIndex),
            studentEmail,
            studentName,
            periodId,
            periodName: dccPeriod.periodName,
            courseName: dccPeriod.courseName,
            teacherId: profile.uid,
            teacherEmail: profile.email,
            teacherName: profile.displayName,
            joinCodeLowercase: "manual",
            active: true,
            seededRoster: true,
            seededRosterBatch: DCC_ROSTER_BATCH,
            createdBySeedScript: true,
            joinedAt: serverTimestamp(),
            removedAt: "",
          };

          if (enrollmentSnapshot.exists()) {
            const existingEnrollment = enrollmentSnapshot.data();
            if (existingEnrollment.seededRosterBatch === DCC_ROSTER_BATCH) {
              await updateDoc(enrollmentRef, {
                active: true,
                removedAt: "",
              });
              availableStudents += 1;
              if (existingEnrollment.active === false) restoredStudents += 1;
            } else {
              availableStudents += 1;
            }
          } else {
            await setDoc(enrollmentRef, enrollmentPayload);
            createdStudents += 1;
          }
        }
      }

      const summary = `DCC practice roster is ready: ${DCC_PERIODS.length} periods, ${totalStudents} students. Created ${createdPeriods} periods and ${createdStudents} student memberships; ${availablePeriods} periods and ${availableStudents} student memberships already existed.${restoredPeriods || restoredStudents ? ` Restored ${restoredPeriods} periods and ${restoredStudents} student memberships.` : ""}`;
      setSeedSummary(summary);
      setToast("DCC practice roster is ready: 3 periods, 90 students.");
    } catch (dccError) {
      setSeedSummary(dccError.message);
      setToast(dccError.message);
    } finally {
      setDccBusy("");
    }
  };

  const removeDccPracticeRoster = async () => {
    if (!isDccRosterOwner(profile)) {
      setToast(`Sign in as ${DCC_OWNER_EMAIL} to remove this DCC roster.`);
      return;
    }

    setDccBusy("remove");
    setSeedSummary("");
    try {
      const dccPeriods = periods.filter((period) => period.seededRosterBatch === DCC_ROSTER_BATCH);
      const dccPeriodIds = new Set(dccPeriods.map((period) => period.id));
      const dccEnrollments = enrollments.filter(
        (enrollment) =>
          enrollment.seededRosterBatch === DCC_ROSTER_BATCH &&
          dccPeriodIds.has(enrollment.periodId),
      );

      for (const enrollment of dccEnrollments) {
        await deleteDoc(doc(db, "periodEnrollments", enrollment.id));
      }

      for (const period of dccPeriods) {
        if (period.joinCodeLowercase) {
          try {
            const joinCodeRef = doc(db, "periodJoinCodes", period.joinCodeLowercase);
            const joinCodeSnapshot = await getDoc(joinCodeRef);
            if (joinCodeSnapshot.exists() && joinCodeSnapshot.data().seededRosterBatch === DCC_ROSTER_BATCH) {
              await deleteDoc(joinCodeRef);
            }
          } catch {
            // Missing or inaccessible join-code records should not block removing marked roster records.
          }
        }
        await updateDoc(doc(db, "periods", period.id), {
          active: false,
          archived: true,
          archivedAt: serverTimestamp(),
          archivedBy: profile.email,
          updatedAt: serverTimestamp(),
        });
        await deleteDoc(doc(db, "periods", period.id));
      }

      const summary = `Removed ${dccPeriods.length} DCC periods and ${dccEnrollments.length} seeded memberships.`;
      setSeedSummary(summary);
      setToast("DCC practice roster removed");
    } catch (removeError) {
      setSeedSummary(removeError.message);
      setToast(removeError.message);
    } finally {
      setDccBusy("");
    }
  };

  useEffect(() => {
    if (loading || dccAutoSeeded || dccBusy || !isDccRosterOwner(profile) || dccRosterReady) return;
    setDccAutoSeeded(true);
    seedDccPracticeRoster();
  }, [loading, dccAutoSeeded, dccBusy, profile?.email, dccRosterReady]);

  // No "remove demo roster" action is exposed: demo periods use the same period/enrollment
  // model as class data, and teachers may attach practice projects to them. Deterministic
  // IDs and demo-style emails make reseeding idempotent without risking real work deletion.
  const seedDemoRoster = async () => {
    const totalStudents = DEMO_PERIODS.reduce((total, period) => total + period.students.length, 0);
    const confirmed = window.confirm(
      `Seed ${DEMO_PERIODS.length} practice periods and ${totalStudents} practice students? This creates predictable period and enrollment records only; it does not create Firebase Auth accounts.`,
    );
    if (!confirmed) return;

    setSeedBusy(true);
    setSeedSummary("");
    try {
      let createdPeriods = 0;
      let availablePeriods = 0;
      let createdStudents = 0;
      let availableStudents = 0;

      for (const demoPeriod of DEMO_PERIODS) {
        const periodId = demoPeriodId(profile, demoPeriod);
        const periodRef = doc(db, "periods", periodId);
        const periodSnapshot = await getDoc(periodRef);
        const joinCode = demoJoinCode(profile, demoPeriod);
        const joinCodeKey = joinCodeLowercase(joinCode);
        const periodPayload = {
          periodId,
          teacherId: profile.uid,
          teacherEmail: profile.email,
          teacherName: profile.displayName,
          periodName: demoPeriod.periodName,
          courseName: demoPeriod.courseName,
          joinCode,
          joinCodeLowercase: joinCodeKey,
          active: true,
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (periodSnapshot.exists()) {
          availablePeriods += 1;
        } else {
          await setDoc(periodRef, periodPayload);
          await setDoc(doc(db, "periodJoinCodes", joinCodeKey), {
            periodId,
            teacherId: profile.uid,
            teacherEmail: profile.email,
            teacherName: profile.displayName,
            periodName: demoPeriod.periodName,
            courseName: demoPeriod.courseName,
            joinCode,
            joinCodeLowercase: joinCodeKey,
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          createdPeriods += 1;
        }

        for (const studentName of demoPeriod.students) {
          const studentEmail = demoStudentEmail(studentName, demoPeriod);
          const enrollmentId = canonicalEnrollmentId(periodId, studentEmail);
          const enrollmentRef = doc(db, "periodEnrollments", enrollmentId);
          const enrollmentSnapshot = await getDoc(enrollmentRef);
          if (enrollmentSnapshot.exists()) {
            availableStudents += 1;
            continue;
          }

          await setDoc(enrollmentRef, {
            enrollmentId,
            studentId: studentEmail,
            studentEmail,
            studentName,
            periodId,
            periodName: demoPeriod.periodName,
            courseName: demoPeriod.courseName,
            teacherId: profile.uid,
            teacherEmail: profile.email,
            teacherName: profile.displayName,
            joinCodeLowercase: "manual",
            active: true,
            joinedAt: serverTimestamp(),
            removedAt: "",
          });
          createdStudents += 1;
        }
      }

      const summary = `${createdPeriods} practice periods created, ${availablePeriods} already available; ${createdStudents} practice students created, ${availableStudents} already available.`;
      setSeedSummary(summary);
      setToast(`Practice roster ready: ${createdStudents + availableStudents} students`);
    } catch (seedError) {
      setSeedSummary(seedError.message);
      setToast(seedError.message);
    } finally {
      setSeedBusy(false);
    }
  };

  return html`
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-lens">Class Codes</p>
          <h1 className="mt-1 text-3xl font-black text-white">Manage Periods</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Create class periods and share join codes so students can enroll themselves.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <${Button} icon=${Sparkles} variant="secondary" disabled=${Boolean(dccBusy)} onClick=${() => setDccConfirm("seed")}>
            ${dccBusy === "seed" ? "Creating..." : "Create DCC Practice Roster"}
          </${Button}>
          <${Button} icon=${Trash2} variant="ghost" disabled=${Boolean(dccBusy)} onClick=${() => setDccConfirm("remove")}>
            ${dccBusy === "remove" ? "Removing..." : "Remove DCC Practice Roster"}
          </${Button}>
          <${Button} icon=${Sparkles} variant="secondary" disabled=${seedBusy} onClick=${seedDemoRoster}>
            ${seedBusy ? "Seeding..." : "Seed Practice Roster"}
          </${Button}>
          <${Badge} icon=${LayoutGrid}>${activePeriods.length} active</${Badge}>
        </div>
      </div>

      ${dccConfirm
        ? html`
            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black text-white">
                    ${dccConfirm === "seed"
                      ? "Create DCC Periods 1-3 with 30 students in each class?"
                      : "Remove the DCC practice roster? This will delete the seeded DCC periods, memberships, and seeded roster records only."}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    This action does not create Firebase Auth accounts, send emails, or change unrelated users.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <${Button}
                    icon=${dccConfirm === "seed" ? Sparkles : Trash2}
                    variant=${dccConfirm === "seed" ? "primary" : "danger"}
                    disabled=${Boolean(dccBusy)}
                    onClick=${async () => {
                      const nextAction = dccConfirm;
                      setDccConfirm("");
                      if (nextAction === "seed") await seedDccPracticeRoster();
                      else await removeDccPracticeRoster();
                    }}
                  >
                    ${dccConfirm === "seed" ? "Create Roster" : "Remove Roster"}
                  </${Button}>
                  <${Button} variant="ghost" disabled=${Boolean(dccBusy)} onClick=${() => setDccConfirm("")}>
                    Cancel
                  </${Button}>
                </div>
              </div>
            </div>
          `
        : null}

      ${seedSummary
        ? html`<p className="rounded-xl bg-lens/10 p-3 text-sm font-semibold text-sky-100 ring-1 ring-lens/25">${seedSummary}</p>`
        : null}

      <${PeriodCreateForm} profile=${profile} setToast=${setToast} />

      ${error ? html`<p className="rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
      ${loading
        ? html`<${EmptyState} icon=${LayoutGrid} title="Loading periods" />`
        : activePeriods.length === 0
          ? html`<${EmptyState} icon=${LayoutGrid} title="No active periods" body="Create a period or restore an archived class to make it available in active workflows." />`
          : html`
              <div className="grid gap-4 xl:grid-cols-2">
                ${activePeriods.map(
                  (period) => html`
                    <${PeriodCard}
                      key=${period.id}
                      profile=${profile}
                      period=${period}
                      enrollments=${activeEnrollmentsForPeriod(enrollments, period.id)}
                      setToast=${setToast}
                    />
                  `,
                )}
              </div>
            `}

      <div className="flex justify-center border-t border-slate-800/80 pt-5">
        <${Button}
          icon=${Archive}
          variant="ghost"
          type="button"
          onClick=${() => setShowArchived((current) => !current)}
        >
          ${showArchived ? "Hide Archived Classes" : "View Archived Classes"}
        </${Button}>
      </div>

      ${showArchived
        ? html`
            <${ArchivedPeriodsPanel}
              profile=${profile}
              periods=${archivedPeriods}
              enrollments=${enrollments}
              projects=${projects}
              setToast=${setToast}
            />
          `
        : null}
    </section>
  `;
}

function PeriodCreateForm({ profile, setToast }) {
  const [form, setForm] = useState({ periodName: "", courseName: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!safeText(form.periodName)) {
      setError("Period name is required.");
      return;
    }

    setBusy(true);
    try {
      const periodRef = doc(collection(db, "periods"));
      const joinCode = await createUniqueJoinCode(form.periodName, form.courseName);
      const periodPayload = {
        periodId: periodRef.id,
        teacherId: profile.uid,
        teacherEmail: profile.email,
        teacherName: profile.displayName,
        periodName: safeText(form.periodName),
        courseName: safeText(form.courseName),
        joinCode,
        joinCodeLowercase: joinCodeLowercase(joinCode),
        active: true,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(periodRef, periodPayload);
      await setDoc(doc(db, "periodJoinCodes", periodPayload.joinCodeLowercase), {
        periodId: periodRef.id,
        teacherId: profile.uid,
        teacherEmail: profile.email,
        teacherName: profile.displayName,
        periodName: periodPayload.periodName,
        courseName: periodPayload.courseName,
        joinCode,
        joinCodeLowercase: periodPayload.joinCodeLowercase,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setForm({ periodName: "", courseName: "" });
      setToast(`Period created. Code: ${joinCode}`);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusy(false);
    }
  };

  return html`
    <form onSubmit=${submit} className="vp-panel rounded-3xl p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Create period</h2>
        <p className="text-sm text-slate-400">A unique join code is generated automatically.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-bold text-slate-300">
          Period name
          <${TextInput}
            value=${form.periodName}
            onInput=${(event) => update("periodName", event.currentTarget.value)}
            placeholder="Period 5"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-300">
          Course name
          <${TextInput}
            value=${form.courseName}
            onInput=${(event) => update("courseName", event.currentTarget.value)}
            placeholder="Video Production"
          />
        </label>
        <div className="flex items-end">
          <${Button} icon=${Plus} type="submit" disabled=${busy} className="w-full">
            ${busy ? "Creating..." : "Create"}
          </${Button}>
        </div>
      </div>
      ${error ? html`<p className="mt-3 rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
    </form>
  `;
}

function PeriodCard({ profile, period, enrollments, setToast }) {
  const [busy, setBusy] = useState("");
  const activeEnrollments = activeEnrollmentsForPeriod(enrollments, period.id);

  const regenerateCode = async () => {
    if (!window.confirm(`Regenerate the join code for ${period.periodName}? The old code will stop working.`)) return;
    setBusy("code");
    try {
      const joinCode = await createUniqueJoinCode(period.periodName, period.courseName);
      if (period.joinCodeLowercase) {
        await setDoc(
          doc(db, "periodJoinCodes", period.joinCodeLowercase),
          { active: false, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }
      await updateDoc(doc(db, "periods", period.id), {
        joinCode,
        joinCodeLowercase: joinCodeLowercase(joinCode),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, "periodJoinCodes", joinCodeLowercase(joinCode)), {
        periodId: period.id,
        teacherId: period.teacherId || profile.uid,
        teacherEmail: period.teacherEmail || profile.email,
        teacherName: period.teacherName || profile.displayName,
        periodName: period.periodName,
        courseName: period.courseName || "",
        joinCode,
        joinCodeLowercase: joinCodeLowercase(joinCode),
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setToast(`New code: ${joinCode}`);
    } catch (codeError) {
      setToast(codeError.message);
    } finally {
      setBusy("");
    }
  };

  const archivePeriod = async () => {
    const warning = activeEnrollments.length
      ? `Archive ${period.periodName}? It has ${activeEnrollments.length} enrolled student${activeEnrollments.length === 1 ? "" : "s"}. Student work will remain saved.`
      : `Archive ${period.periodName}?`;
    if (!window.confirm(warning)) return;
    setBusy("archive");
    try {
      await updateDoc(doc(db, "periods", period.id), {
        active: false,
        archived: true,
        archivedAt: serverTimestamp(),
        archivedBy: profile.email,
        updatedAt: serverTimestamp(),
      });
      if (period.joinCodeLowercase) {
        await setDoc(
          doc(db, "periodJoinCodes", period.joinCodeLowercase),
          { active: false, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }
      setToast(`${period.periodName} archived`);
    } catch (archiveError) {
      setToast(archiveError.message);
    } finally {
      setBusy("");
    }
  };

  const removeStudent = async (enrollment) => {
    if (!window.confirm(`Remove ${enrollment.studentName || enrollment.studentEmail} from ${period.periodName}?`)) return;
    setBusy(enrollment.id);
    try {
      await updateDoc(doc(db, "periodEnrollments", enrollment.id), {
        active: false,
        removedAt: serverTimestamp(),
      });
      setToast("Student removed from period");
    } catch (removeError) {
      setToast(removeError.message);
    } finally {
      setBusy("");
    }
  };

  return html`
    <article className=${classNames("vp-panel rounded-3xl p-4", period.archived ? "opacity-65" : "")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            ${period.courseName || "Course"}
          </p>
          <h2 className="mt-1 text-xl font-black text-white">${period.periodName}</h2>
          <p className="mt-1 text-sm text-slate-400">${activeEnrollments.length} enrolled student${activeEnrollments.length === 1 ? "" : "s"}</p>
        </div>
        <${Badge} icon=${period.active && !period.archived ? Radio : Archive}>
          ${period.active && !period.archived ? "Active" : "Archived"}
        </${Badge}>
      </div>

      <div className="mt-4 rounded-2xl border border-lens/20 bg-lens/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-lens">Join code</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="select-all text-2xl font-black tracking-[0.12em] text-white">${period.joinCode}</p>
          <div className="flex flex-wrap gap-2">
            <${Button}
              icon=${Copy}
              variant="secondary"
              onClick=${() => copyText(period.joinCode, "Join code", setToast)}
            >
              Copy
            </${Button}>
            <${Button}
              icon=${RefreshCcw}
              variant="ghost"
              disabled=${busy === "code" || period.archived}
              onClick=${regenerateCode}
            >
              Regenerate
            </${Button}>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-black text-white">Enrolled students</h3>
          <${Badge} icon=${Users}>${activeEnrollments.length}</${Badge}>
        </div>
        ${activeEnrollments.length === 0
          ? html`<p className="rounded-2xl bg-slate-950/42 p-3 text-sm text-slate-500">No students have joined yet.</p>`
          : html`
              <div className="grid gap-2">
                ${activeEnrollments.map(
                  (enrollment) => html`
                    <div key=${enrollment.id} className="flex flex-col gap-2 rounded-2xl bg-slate-950/42 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-black text-white">${enrollment.studentName || titleFromEmail(enrollment.studentEmail)}</p>
                        <p className="truncate text-sm text-slate-500">${enrollment.studentEmail}</p>
                      </div>
                      <${Button}
                        icon=${X}
                        variant="ghost"
                        disabled=${busy === enrollment.id}
                        onClick=${() => removeStudent(enrollment)}
                      >
                        Remove
                      </${Button}>
                    </div>
                  `,
                )}
              </div>
            `}
      </div>

      <div className="mt-4 flex justify-end">
        <${Button}
          icon=${Archive}
          variant="danger"
          disabled=${busy === "archive" || period.archived}
          onClick=${archivePeriod}
        >
          Archive Period
        </${Button}>
      </div>
    </article>
  `;
}

function ArchivedPeriodsPanel({ profile, periods, enrollments, projects, setToast }) {
  return html`
    <section className="vp-panel rounded-3xl border border-warning/30 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-warning">Archived Classes</p>
          <h2 className="mt-1 text-2xl font-black text-white">Inactive class periods</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            These classes are hidden from active workflows, joins, project assignment, and monitor selectors.
          </p>
        </div>
        <${Badge} icon=${Archive}>${periods.length} archived</${Badge}>
      </div>

      ${periods.length === 0
        ? html`<${EmptyState} icon=${Archive} title="No archived classes." body="Archived periods will appear here after you archive them." />`
        : html`
            <div className="grid gap-4 xl:grid-cols-2">
              ${periods.map(
                (period) => html`
                  <${ArchivedPeriodCard}
                    key=${period.id}
                    profile=${profile}
                    period=${period}
                    enrollments=${activeEnrollmentsForPeriod(enrollments, period.id)}
                    periodEnrollments=${enrollments.filter((enrollment) => enrollment.periodId === period.id)}
                    projects=${projects}
                    setToast=${setToast}
                  />
                `,
              )}
            </div>
          `}
    </section>
  `;
}

function ArchivedPeriodCard({ profile, period, enrollments, periodEnrollments, projects, setToast }) {
  const [busy, setBusy] = useState("");
  const activeEnrollments = activeEnrollmentsForPeriod(enrollments, period.id);

  const restorePeriod = async () => {
    setBusy("restore");
    try {
      await updateDoc(doc(db, "periods", period.id), {
        active: true,
        archived: false,
        archivedAt: "",
        archivedBy: "",
        updatedAt: serverTimestamp(),
      });
      if (period.joinCodeLowercase) {
        await setDoc(
          doc(db, "periodJoinCodes", period.joinCodeLowercase),
          { active: true, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }
      setToast(`${period.periodName} restored`);
    } catch (restoreError) {
      setToast(restoreError.message);
    } finally {
      setBusy("");
    }
  };

  const removeDeletedPeriodFromProjects = async () => {
    const handledProjectIds = new Set();
    for (const project of projects.filter((candidate) => projectBelongsToPeriod(candidate, period.id))) {
      if (handledProjectIds.has(project.id)) continue;
      handledProjectIds.add(project.id);
      const periodIds = normalizeProjectPeriodIds(project);
      if (periodIds.length <= 1) continue;

      const remainingPeriodIds = periodIds.filter((periodId) => periodId !== period.id);
      if (!remainingPeriodIds.length) continue;

      const remainingSummaries = projectPeriodSummaries(project, []).filter(
        (summary) => summary.id !== period.id,
      );
      const nextPrimaryPeriodId =
        project.periodId === period.id ? remainingPeriodIds[0] : project.periodId;
      const nextPrimarySummary =
        remainingSummaries.find((summary) => summary.id === nextPrimaryPeriodId) ||
        remainingSummaries[0];
      const nextGroupsByPeriod = { ...(project.groupsByPeriod || {}) };
      delete nextGroupsByPeriod[period.id];

      try {
        await updateDoc(doc(db, "videoProjects", project.id), {
          periodIds: remainingPeriodIds,
          periodId: nextPrimaryPeriodId,
          periodName: nextPrimarySummary?.periodName || "Deleted period",
          courseName: nextPrimarySummary?.courseName || "",
          periodNames: remainingSummaries.map(periodSummaryLabel),
          periodSummaries: remainingSummaries,
          groupsByPeriod: nextGroupsByPeriod,
          updatedAt: serverTimestamp(),
          lastActivityAt: serverTimestamp(),
          lastActivityBy: profile.email,
        });
      } catch {
        // Leave the project in place if permissions or legacy data prevent cleanup.
        // Project display helpers handle missing period records without crashing.
      }
    }
  };

  const deletePermanently = async () => {
    if (!isPeriodArchived(period)) {
      setToast("Only archived classes can be permanently deleted.");
      return;
    }
    const confirmed = window.confirm(
      `Delete "${period.periodName}" permanently? This cannot be undone. Student and teacher user accounts will not be deleted.`,
    );
    if (!confirmed) return;

    setBusy("delete");
    try {
      await removeDeletedPeriodFromProjects();

      let codeDocuments = [];
      try {
        const codeConstraints = isVideoAdmin(profile)
          ? [where("periodId", "==", period.id)]
          : [where("periodId", "==", period.id), where("teacherId", "==", profile.uid)];
        const codeSnapshot = await getDocs(query(collection(db, "periodJoinCodes"), ...codeConstraints));
        codeDocuments = codeSnapshot.docs;
      } catch {
        codeDocuments = [];
      }

      // The current data model stores period-related records in top-level collections,
      // not subcollections under periods/{periodId}; those direct records are cleaned here.
      for (const enrollment of periodEnrollments) {
        await deleteDoc(doc(db, "periodEnrollments", enrollment.id));
      }
      for (const codeDocument of codeDocuments) {
        await deleteDoc(doc(db, "periodJoinCodes", codeDocument.id));
      }
      if (period.joinCodeLowercase && !codeDocuments.some((item) => item.id === period.joinCodeLowercase)) {
        try {
          await deleteDoc(doc(db, "periodJoinCodes", period.joinCodeLowercase));
        } catch {
          // Old or missing join-code docs should not block deleting the archived period.
        }
      }
      await deleteDoc(doc(db, "periods", period.id));
      setToast(`${period.periodName} permanently deleted`);
    } catch (deleteError) {
      setToast(deleteError.message);
    } finally {
      setBusy("");
    }
  };

  return html`
    <article className="rounded-3xl border border-slate-700/70 bg-slate-950/35 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-warning">
            ${period.courseName || "Course"}
          </p>
          <h3 className="mt-1 truncate text-xl font-black text-white">${period.periodName}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Archived ${timestampLabel(period.archivedAt)}${period.archivedBy ? ` by ${period.archivedBy}` : ""}
          </p>
        </div>
        <${Badge} icon=${Archive}>Archived</${Badge}>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-950/50 p-3 ring-1 ring-slate-700/70">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Join code</p>
          <p className="mt-1 select-all font-black text-white">${period.joinCode || "No code"}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-3 ring-1 ring-slate-700/70">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Owner</p>
          <p className="mt-1 truncate font-black text-white">${period.teacherName || period.teacherEmail || "Unknown"}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-3 ring-1 ring-slate-700/70 sm:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Members</p>
          <p className="mt-1 font-black text-white">${activeEnrollments.length} enrolled student${activeEnrollments.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <${Button}
          icon=${RefreshCcw}
          type="button"
          variant="secondary"
          disabled=${Boolean(busy)}
          onClick=${restorePeriod}
        >
          ${busy === "restore" ? "Restoring..." : "Restore"}
        </${Button}>
        <${Button}
          icon=${Trash2}
          type="button"
          variant="danger"
          disabled=${Boolean(busy)}
          onClick=${deletePermanently}
        >
          ${busy === "delete" ? "Deleting..." : "Delete Permanently"}
        </${Button}>
      </div>
    </article>
  `;
}

function ProjectManager({ profile, projects, loading, error, setToast, onPreviewStudent, periods, enrollments }) {
  return html`
    <section className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-lens">Project Control</p>
        <h1 className="mt-1 text-3xl font-black text-white">Production Projects</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Create field production assignments for student crews in a separate production workflow.
        </p>
      </div>

      <${ProjectCreateForm}
        profile=${profile}
        periods=${periods}
        enrollments=${enrollments}
        setToast=${setToast}
      />

      ${error ? html`<p className="rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
      ${loading
        ? html`<${EmptyState} icon=${ClipboardCheck} title="Loading projects" />`
        : html`
            <div className="grid gap-4 lg:grid-cols-2">
              ${projects.map(
                (project) => html`
                  <${ProjectAdminCard}
                    key=${project.id}
                    profile=${profile}
                    project=${project}
                    setToast=${setToast}
                    onPreviewStudent=${onPreviewStudent}
                    periods=${periods}
                    enrollments=${enrollments}
                  />
                `,
              )}
            </div>
          `}
    </section>
  `;
}

function MultiPeriodDropdown({ periods, selectedPeriodIds, onChange }) {
  const [open, setOpen] = useState(false);
  const selectedPeriods = periods.filter((period) => selectedPeriodIds.includes(period.id));
  const label =
    selectedPeriods.length === 0
      ? "Select class periods"
      : selectedPeriods.length === 1
        ? periodSummaryLabel(selectedPeriods[0])
        : `${selectedPeriods.length} periods selected`;

  const togglePeriod = (periodId) => {
    onChange(
      selectedPeriodIds.includes(periodId)
        ? selectedPeriodIds.filter((id) => id !== periodId)
        : [...selectedPeriodIds, periodId],
    );
  };

  return html`
    <div className="relative">
      <button
        type="button"
        className="vp-field flex min-h-12 w-full items-center justify-between gap-3 px-3 py-3 text-left font-black"
        onClick=${() => setOpen((current) => !current)}
        aria-expanded=${open}
      >
        <span>${label}</span>
        <${ChevronDown} size=${18} />
      </button>
      ${open
        ? html`
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-72 overflow-y-auto rounded-2xl border border-slate-700/70 bg-slate-950 p-2 shadow-2xl">
              ${periods.map(
                (period) => html`
                  <label
                    key=${period.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked=${selectedPeriodIds.includes(period.id)}
                      onChange=${() => togglePeriod(period.id)}
                    />
                    <span>
                      ${period.periodName}${period.courseName ? ` - ${period.courseName}` : ""}
                    </span>
                  </label>
                `,
              )}
            </div>
          `
        : null}
    </div>
  `;
}

function ProjectCreateForm({ profile, periods, enrollments, setToast }) {
  const activePeriods = getActivePeriods(periods);
  const [form, setForm] = useState(() => ({
    title: "",
    objective: "",
    dueDate: todayISO(),
    periodIds: [],
    assignedTeacherEmail: profile.email,
    teacherNotes: "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  useEffect(() => {
    setForm((current) => ({
      ...current,
      periodIds: current.periodIds.filter((periodId) =>
        activePeriods.some((period) => period.id === periodId),
      ),
    }));
  }, [activePeriods.map((period) => period.id).join("|")]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const selectedPeriods = activePeriods.filter((period) => form.periodIds.includes(period.id));
    const primaryPeriod = selectedPeriods[0];
    const periodIds = selectedPeriods.map((period) => period.id);
    const groupsByPeriod = periodIds.reduce((groups, periodId) => ({ ...groups, [periodId]: [] }), {});
    const assignedStudentEmails = [
      ...new Set(
        periodIds
          .flatMap((periodId) => activeEnrollmentsForPeriod(enrollments, periodId))
          .map((enrollment) => normalizeEmail(enrollment.studentEmail))
          .filter(Boolean),
      ),
    ];
    const assignedTeacherEmail = normalizeEmail(primaryPeriod?.teacherEmail || profile.email);

    if (!safeText(form.title) || !safeText(form.objective)) {
      setError("Project title and objective are required.");
      return;
    }
    if (!selectedPeriods.length) {
      setError("Select at least one class period before creating a project.");
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
        periodId: primaryPeriod.id,
        periodIds,
        periodName: primaryPeriod.periodName,
        courseName: primaryPeriod.courseName || "",
        periodNames: selectedPeriods.map(periodSummaryLabel),
        periodSummaries: selectedPeriods.map((period) => ({
          id: period.id,
          periodName: period.periodName,
          courseName: period.courseName || "",
        })),
        groupName: "Groups by period",
        groupMode: true,
        groups: [],
        groupsByPeriod,
        assignedStudentEmails,
        assignedStudentNames: assignedStudentEmails.map(titleFromEmail),
        teacherId: primaryPeriod.teacherId || profile.uid,
        assignedTeacherEmail,
        assignedTeacherName:
          primaryPeriod.teacherName ||
          (assignedTeacherEmail === profile.email ? profile.displayName : titleFromEmail(assignedTeacherEmail)),
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
        periodIds: [],
        assignedTeacherEmail: profile.email,
        teacherNotes: "",
      });
      setToast("Production project created");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!activePeriods.length) {
    return html`
      <${EmptyState}
        icon=${LayoutGrid}
        title="Create a period first"
        body="Projects now belong to a class period so students can join with a code."
      />
    `;
  }

  return html`
    <form onSubmit=${submit} className="vp-panel rounded-3xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Create project</h2>
          <p className="text-sm text-slate-400">Assign one field workflow to multiple periods, then build groups per period.</p>
        </div>
        <${Badge} icon=${Plus}>New</${Badge}>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold text-slate-300">
          Class periods
          <${MultiPeriodDropdown}
            periods=${activePeriods}
            selectedPeriodIds=${form.periodIds}
            onChange=${(periodIds) => update("periodIds", periodIds)}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-300">
          Project title
          <${TextInput} value=${form.title} onInput=${(event) => update("title", event.currentTarget.value)} placeholder="Documentary opening package" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-300">
          Due date
          <${TextInput} type="date" value=${form.dueDate} onInput=${(event) => update("dueDate", event.currentTarget.value)} />
        </label>
        <div className="md:col-span-2 rounded-2xl bg-slate-950/35 p-3 text-sm leading-6 text-slate-400 ring-1 ring-slate-700/70">
          Groups are managed per period after the project is created. Current period selections will make each period available as its own grouping tab.
        </div>
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

function PeriodScopedGroupManager({ profile, project, periods, enrollments, setToast }) {
  const periodSummaries = projectPeriodSummaries(project, periods);
  const periodIds = periodSummaries.map((period) => period.id);
  const [selectedPeriodId, setSelectedPeriodId] = useState(periodIds[0] || "");
  const [openGroupId, setOpenGroupId] = useState("");
  const [groupsByPeriod, setGroupsByPeriod] = useState(() => normalizeGroupsByPeriod(project));
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const groupSignature = JSON.stringify(project.groupsByPeriod || project.groups || []);

  useEffect(() => {
    setGroupsByPeriod(normalizeGroupsByPeriod(project));
  }, [project.id, groupSignature, normalizeProjectPeriodIds(project).join("|"), project.periodId]);

  useEffect(() => {
    if (!periodIds.length) return;
    if (!periodIds.includes(selectedPeriodId)) setSelectedPeriodId(periodIds[0]);
  }, [periodIds.join("|"), selectedPeriodId]);

  const selectedStudents = studentsForPeriod(enrollments, selectedPeriodId);
  const currentGroups = normalizeGroupItems(groupsByPeriod[selectedPeriodId] || []);
  const assignedEmails = new Set(
    currentGroups.flatMap((group) => group.assignedStudentEmails).map(normalizeEmail),
  );
  const ungroupedStudents = selectedStudents.filter((student) => !assignedEmails.has(student.email));
  const openGroup = currentGroups.find((group) => group.id === openGroupId);

  useEffect(() => {
    if (currentGroups.length && !currentGroups.some((group) => group.id === openGroupId)) {
      setOpenGroupId(currentGroups[0].id);
    }
    if (!currentGroups.length && openGroupId) setOpenGroupId("");
  }, [currentGroups.map((group) => group.id).join("|"), openGroupId]);

  const persistGroups = async (nextGroupsByPeriod, action = "Updated period groups") => {
    const normalizedGroupsByPeriod = periodIds.reduce((result, periodId) => {
      result[periodId] = normalizeGroupItems(nextGroupsByPeriod[periodId] || []);
      return result;
    }, {});
    const rosterEmails = periodIds.flatMap((periodId) =>
      studentsForPeriod(enrollments, periodId).map((student) => student.email),
    );
    const assignedStudentEmails = [
      ...new Set([
        ...rosterEmails,
        ...groupStudentEmailsByPeriod(normalizedGroupsByPeriod),
      ]),
    ].filter(Boolean);
    const firstPeriodId = periodIds[0] || project.periodId;
    const firstPeriodGroups = normalizeGroupItems(normalizedGroupsByPeriod[firstPeriodId] || []);

    setGroupsByPeriod(normalizedGroupsByPeriod);
    setBusy("groups");
    setError("");
    try {
      await saveProjectPatch(
        project,
        profile,
        {
          periodIds,
          groupsByPeriod: normalizedGroupsByPeriod,
          groups: firstPeriodGroups,
          groupName: firstPeriodGroups.length ? projectGroupLabel({ groups: firstPeriodGroups }) : "Groups by period",
          groupMode: true,
          assignedStudentEmails,
          assignedStudentNames: assignedStudentEmails.map(titleFromEmail),
        },
        action,
      );
      setToast("Project groups saved");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy("");
    }
  };

  const moveStudentToGroup = async (student, groupId) => {
    if (!student?.email || !selectedPeriodId) return;
    const nextGroups = currentGroups.map((group) => {
      const withoutStudent = group.assignedStudentEmails.filter((email) => normalizeEmail(email) !== student.email);
      if (group.id !== groupId) {
        return {
          ...group,
          assignedStudentEmails: withoutStudent,
          assignedStudentNames: withoutStudent.map(titleFromEmail),
        };
      }
      const assignedStudentEmails = [...new Set([...withoutStudent, student.email])];
      return {
        ...group,
        assignedStudentEmails,
        assignedStudentNames: assignedStudentEmails.map(titleFromEmail),
      };
    });
    setOpenGroupId(groupId);
    await persistGroups({ ...groupsByPeriod, [selectedPeriodId]: nextGroups }, "Moved student group");
  };

  const removeStudentFromGroups = async (studentEmail) => {
    const email = normalizeEmail(studentEmail);
    const nextGroups = currentGroups.map((group) => {
      const assignedStudentEmails = group.assignedStudentEmails.filter(
        (assignedEmail) => normalizeEmail(assignedEmail) !== email,
      );
      return {
        ...group,
        assignedStudentEmails,
        assignedStudentNames: assignedStudentEmails.map(titleFromEmail),
      };
    });
    await persistGroups({ ...groupsByPeriod, [selectedPeriodId]: nextGroups }, "Removed student from group");
  };

  const createGroup = async (student = null) => {
    const group = {
      id: makeId("group"),
      name: `Group ${currentGroups.length + 1}`,
      assignedStudentEmails: student?.email ? [student.email] : [],
      assignedStudentNames: student?.email ? [student.name || titleFromEmail(student.email)] : [],
    };
    const cleanedGroups = student?.email
      ? currentGroups.map((existingGroup) => {
          const assignedStudentEmails = existingGroup.assignedStudentEmails.filter(
            (email) => normalizeEmail(email) !== student.email,
          );
          return {
            ...existingGroup,
            assignedStudentEmails,
            assignedStudentNames: assignedStudentEmails.map(titleFromEmail),
          };
        })
      : currentGroups;
    const nextGroups = [...cleanedGroups, group];
    setOpenGroupId(group.id);
    await persistGroups({ ...groupsByPeriod, [selectedPeriodId]: nextGroups }, "Created group");
  };

  const deleteGroup = async (groupId) => {
    const group = currentGroups.find((candidate) => candidate.id === groupId);
    if (!group) return;
    const hasStudents = group.assignedStudentEmails.length > 0;
    const confirmed =
      !hasStudents ||
      window.confirm(`Delete ${group.name}? Its students will move back to the ungrouped list for this period.`);
    if (!confirmed) return;

    const nextGroups = currentGroups.filter((candidate) => candidate.id !== groupId);
    setOpenGroupId(nextGroups[0]?.id || "");
    await persistGroups({ ...groupsByPeriod, [selectedPeriodId]: nextGroups }, "Deleted group");
  };

  const updateGroupName = (groupId, name) => {
    setGroupsByPeriod((current) => ({
      ...current,
      [selectedPeriodId]: normalizeGroupItems(current[selectedPeriodId] || []).map((group) =>
        group.id === groupId ? { ...group, name } : group,
      ),
    }));
  };

  const saveGroupNames = async () => {
    await persistGroups(groupsByPeriod, "Renamed group");
  };

  const studentFromDrag = (event) => {
    try {
      const data = JSON.parse(event.dataTransfer.getData("application/json") || "{}");
      if (data.periodId !== selectedPeriodId) return null;
      return {
        email: normalizeEmail(data.email),
        name: safeText(data.name) || titleFromEmail(data.email),
      };
    } catch {
      return null;
    }
  };

  const startDrag = (event, student) => {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ ...student, periodId: selectedPeriodId }),
    );
    event.dataTransfer.setData("text/plain", student.email);
    event.dataTransfer.effectAllowed = "move";
  };

  if (!periodSummaries.length) {
    return html`
      <section className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/35 p-4">
        <p className="font-black text-white">No periods assigned</p>
        <p className="mt-1 text-sm text-slate-400">Assign this project to a period before managing groups.</p>
      </section>
    `;
  }

  return html`
    <section className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/35 p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-black text-white">Groups by period</h4>
          <p className="text-sm text-slate-400">Switch periods, then drag students into one open group at a time.</p>
        </div>
        <${Badge} icon=${Users}>${selectedStudents.length} students</${Badge}>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        ${periodSummaries.map(
          (summary) => html`
            <button
              key=${summary.id}
              type="button"
              className=${classNames(
                "shrink-0 rounded-xl px-3 py-2 text-sm font-black transition",
                selectedPeriodId === summary.id
                  ? "bg-lens text-slate-950"
                  : "bg-slate-900 text-slate-300 ring-1 ring-slate-700/70 hover:bg-slate-800",
              )}
              onClick=${() => setSelectedPeriodId(summary.id)}
            >
              ${periodSummaryLabel(summary)}
            </button>
          `,
        )}
      </div>

      ${selectedStudents.length === 0
        ? html`<p className="rounded-2xl bg-slate-950/42 p-3 text-sm text-slate-500">No students are enrolled in this period yet.</p>`
        : html`
            <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-2xl border border-slate-700/70 bg-slate-950/42 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="font-black text-white">Ungrouped Students</h5>
                  <${Badge} icon=${Users}>${ungroupedStudents.length}</${Badge}>
                </div>
                ${ungroupedStudents.length === 0
                  ? html`<p className="rounded-xl bg-slate-900 p-3 text-sm text-slate-500">No ungrouped students.</p>`
                  : html`
                      <div className="grid gap-2">
                        ${ungroupedStudents.map(
                          (student) => html`
                            <div
                              key=${student.email}
                              draggable=${true}
                              onDragStart=${(event) => startDrag(event, student)}
                              className="flex cursor-grab flex-col gap-2 rounded-xl bg-slate-900 p-3 ring-1 ring-slate-700/70 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-black text-white">${student.name}</p>
                                <p className="truncate text-xs text-slate-500">${student.email}</p>
                              </div>
                              ${openGroup
                                ? html`
                                    <${Button}
                                      type="button"
                                      variant="ghost"
                                      onClick=${() => moveStudentToGroup(student, openGroup.id)}
                                    >
                                      Add to open group
                                    </${Button}>
                                  `
                                : null}
                            </div>
                          `,
                        )}
                      </div>
                    `}
              </section>

              <section className="space-y-3">
                ${currentGroups.length === 0
                  ? html`<p className="rounded-2xl bg-slate-950/42 p-3 text-sm text-slate-500">No groups yet. Use the drop zone below to create one.</p>`
                  : null}
                ${currentGroups.map((group) => {
                  const isOpen = group.id === openGroupId;
                  const groupStudents = group.assignedStudentEmails.map((email) => ({
                    email,
                    name:
                      selectedStudents.find((student) => student.email === normalizeEmail(email))?.name ||
                      titleFromEmail(email),
                  }));
                  return html`
                    <article
                      key=${group.id}
                      className=${classNames(
                        "rounded-2xl border p-3 transition",
                        isOpen
                          ? "border-lens/45 bg-lens/10"
                          : "border-slate-700/70 bg-slate-950/42 hover:border-lens/30",
                      )}
                      onDragOver=${(event) => {
                        event.preventDefault();
                        setOpenGroupId(group.id);
                      }}
                      onDrop=${(event) => {
                        event.preventDefault();
                        const student = studentFromDrag(event);
                        if (student) moveStudentToGroup(student, group.id);
                      }}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 text-left"
                        onClick=${() => setOpenGroupId(group.id)}
                      >
                        <span>
                          <span className="block font-black text-white">${group.name}</span>
                          <span className="text-xs font-semibold text-slate-500">
                            ${groupStudents.length} student${groupStudents.length === 1 ? "" : "s"}
                          </span>
                        </span>
                        <${ChevronDown}
                          size=${18}
                          className=${classNames("transition", isOpen ? "rotate-180 text-lens" : "text-slate-500")}
                        />
                      </button>

                      ${isOpen
                        ? html`
                            <div className="mt-3 space-y-3">
                              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                                <label className="grid gap-1 text-sm font-bold text-slate-300">
                                  Group name
                                  <${TextInput}
                                    value=${group.name}
                                    onInput=${(event) => updateGroupName(group.id, event.currentTarget.value)}
                                    onBlur=${saveGroupNames}
                                  />
                                </label>
                                <${Button}
                                  icon=${Trash2}
                                  type="button"
                                  variant="ghost"
                                  onClick=${() => deleteGroup(group.id)}
                                >
                                  Delete group
                                </${Button}>
                              </div>
                              <div className="min-h-24 rounded-2xl border border-dashed border-lens/35 bg-slate-950/35 p-3">
                                ${groupStudents.length === 0
                                  ? html`<p className="text-sm text-slate-500">Drop students here or use the fallback button.</p>`
                                  : html`
                                      <div className="grid gap-2">
                                        ${groupStudents.map(
                                          (student) => html`
                                            <div
                                              key=${student.email}
                                              draggable=${true}
                                              onDragStart=${(event) => startDrag(event, student)}
                                              className="flex cursor-grab flex-col gap-2 rounded-xl bg-slate-900 p-3 ring-1 ring-slate-700/70 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                              <div className="min-w-0">
                                                <p className="truncate font-black text-white">${student.name}</p>
                                                <p className="truncate text-xs text-slate-500">${student.email}</p>
                                              </div>
                                              <${Button}
                                                type="button"
                                                variant="ghost"
                                                onClick=${() => removeStudentFromGroups(student.email)}
                                              >
                                                Remove
                                              </${Button}>
                                            </div>
                                          `,
                                        )}
                                      </div>
                                    `}
                              </div>
                            </div>
                          `
                        : null}
                    </article>
                  `;
                })}

                <button
                  type="button"
                  className="flex min-h-24 w-full items-center justify-center rounded-2xl border border-dashed border-slate-600/80 bg-transparent p-4 text-sm font-black text-slate-400 transition hover:border-lens/60 hover:text-lens"
                  onClick=${() => createGroup()}
                  onDragOver=${(event) => event.preventDefault()}
                  onDrop=${(event) => {
                    event.preventDefault();
                    const student = studentFromDrag(event);
                    if (student) createGroup(student);
                  }}
                >
                  Add new group?
                </button>
              </section>
            </div>
          `}

      ${busy ? html`<p className="mt-3 text-sm font-bold text-lens">Saving groups...</p>` : null}
      ${error ? html`<p className="mt-3 rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
    </section>
  `;
}

function ProjectAdminCard({ profile, project, setToast, onPreviewStudent, periods, enrollments }) {
  const progress = projectProgress(project);
  const [busy, setBusy] = useState("");
  const periodSummaries = projectPeriodSummaries(project, periods);
  const periodCount = periodSummaries.length;
  const studentCount = (project.assignedStudentEmails || []).length;

  const updateStatus = async (status) => {
    setBusy(`status-${status}`);
    try {
      await saveProjectPatch(project, profile, { status }, `Marked project ${status}`);
      setToast(`Project marked ${status}`);
    } catch (statusError) {
      setToast(statusError.message);
    } finally {
      setBusy("");
    }
  };

  const deleteProject = async () => {
    const confirmed = window.confirm(
      `Delete "${project.title}" permanently? This removes the project from Video Production Studio for everyone.`,
    );
    if (!confirmed) return;

    setBusy("delete");
    try {
      await deleteDoc(doc(db, "videoProjects", project.id));
      await addActivity(project, profile, "Deleted project");
      setToast("Project deleted");
    } catch (deleteError) {
      setToast(deleteError.message);
    } finally {
      setBusy("");
    }
  };

  return html`
    <article className="vp-panel rounded-3xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-white">${project.title}</h3>
          <p className="mt-1 text-sm text-slate-400">${projectPeriodLabel(project, periods)} - Due ${toDateLabel(project.dueDate)}</p>
        </div>
        <${Badge} icon=${Gauge}>${progress.percent}%</${Badge}>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">${project.objective}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        ${periodCount
          ? html`
              <${Badge} icon=${LayoutGrid}>
                ${periodCount === 1 ? periodSummaryLabel(periodSummaries[0]) : `${periodCount} periods`}
              </${Badge}>
            `
          : null}
        <${Badge} icon=${Users}>${studentCount} students</${Badge}>
        <${Badge} icon=${UserCog}>${project.assignedTeacherEmail}</${Badge}>
        <${Badge} icon=${Radio}>${project.status}</${Badge}>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950/70">
        <div className="h-full rounded-full bg-lens" style=${{ width: `${progress.percent}%` }}></div>
      </div>
      <${PeriodScopedGroupManager}
        profile=${profile}
        project=${project}
        periods=${periods}
        enrollments=${enrollments}
        setToast=${setToast}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        ${isVideoAdmin(profile)
          ? html`
              <${Button}
                icon=${Eye}
                type="button"
                variant="secondary"
                onClick=${() => onPreviewStudent(project.id)}
              >
                Preview as Student
              </${Button}>
              <${Button}
                icon=${Trash2}
                type="button"
                variant="danger"
                disabled=${Boolean(busy)}
                onClick=${deleteProject}
              >
                Delete Project
              </${Button}>
            `
          : null}
        ${PROJECT_STATUSES.map(
          (status) => html`
            <${Button}
              key=${status}
              type="button"
              variant=${project.status === status ? "primary" : "ghost"}
              disabled=${Boolean(busy)}
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

function StudentJoinPeriod({ profile, setToast }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const joinPeriod = async (event) => {
    event.preventDefault();
    setError("");
    const normalizedCode = normalizeJoinCode(code);
    const codeKey = joinCodeLowercase(normalizedCode);
    if (!normalizedCode) {
      setError("Enter the class code from your teacher.");
      return;
    }

    setBusy(true);
    try {
      const codeSnapshot = await getDoc(doc(db, "periodJoinCodes", codeKey));
      if (!codeSnapshot.exists() || codeSnapshot.data().active !== true) {
        setError("That class code was not found or is no longer active.");
        return;
      }
      const periodCode = codeSnapshot.data();
      const enrollmentId = `${periodCode.periodId}_${profile.uid}`;
      const enrollmentRef = doc(db, "periodEnrollments", enrollmentId);
      const existingEnrollment = await getDoc(enrollmentRef);
      if (existingEnrollment.exists() && existingEnrollment.data().active !== false) {
        setError("You have already joined this period.");
        return;
      }
      if (existingEnrollment.exists()) {
        setError("Your previous enrollment was removed. Ask your teacher to add you back.");
        return;
      }

      await setDoc(enrollmentRef, {
        enrollmentId,
        studentId: profile.uid,
        studentEmail: profile.email,
        studentName: profile.displayName,
        periodId: periodCode.periodId,
        periodName: periodCode.periodName,
        courseName: periodCode.courseName || "",
        teacherId: periodCode.teacherId,
        teacherEmail: periodCode.teacherEmail || "",
        teacherName: periodCode.teacherName || "",
        joinCodeLowercase: codeKey,
        active: true,
        joinedAt: serverTimestamp(),
        removedAt: "",
      });
      setCode("");
      setToast(`Joined ${periodCode.periodName}`);
    } catch (joinError) {
      setError(joinError.message);
    } finally {
      setBusy(false);
    }
  };

  return html`
    <section className="grid min-h-[70vh] place-items-center">
      <form onSubmit=${joinPeriod} className="vp-panel w-full max-w-xl rounded-3xl p-5 text-center sm:p-7">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lens/12 text-lens ring-1 ring-lens/25">
          <${LayoutGrid} size=${28} />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-lens">Class Code Required</p>
        <h1 className="mt-2 text-3xl font-black text-white">Enter Class Code</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Ask your teacher for the Video Production period code before opening class projects.
        </p>
        <${TextInput}
          value=${code}
          onInput=${(event) => setCode(normalizeJoinCode(event.currentTarget.value))}
          placeholder="VP5-9137"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck=${false}
          className="mt-5 text-center text-2xl font-black tracking-[0.16em]"
        />
        ${error ? html`<p className="mt-3 rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
        <${Button} icon=${LogIn} type="submit" disabled=${busy} className="mt-4 w-full">
          ${busy ? "Joining..." : "Join Period"}
        </${Button}>
      </form>
    </section>
  `;
}

function StudentFilmingHome({
  profile,
  projects,
  loading,
  error,
  enrollments,
  periods,
  enrollmentsLoading,
  enrollmentsError,
  periodsLoading,
  setToast,
  setKioskActive,
}) {
  const activePeriodIds = new Set(getActivePeriods(periods).map((period) => period.id));
  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.active !== false && activePeriodIds.has(enrollment.periodId),
  );
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

  if (enrollmentsLoading || periodsLoading) return html`<${EmptyState} icon=${LayoutGrid} title="Checking period enrollment" />`;
  if (enrollmentsError) return html`<${EmptyState} icon=${AlertTriangle} title="Enrollment error" body=${enrollmentsError} />`;
  if (!activeEnrollments.length) {
    return html`<${StudentJoinPeriod} profile=${profile} setToast=${setToast} />`;
  }
  if (loading) return html`<${EmptyState} icon=${Camera} title="Loading assigned projects" />`;
  if (error) return html`<${EmptyState} icon=${AlertTriangle} title="Project access error" body=${error} />`;
  if (!activeProjects.length) {
    return html`
      <${EmptyState}
        icon=${Camera}
        title="No projects for your joined period"
        body="You joined a period. Your teacher still needs to create or activate a project for it."
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

function AdminStudentPreview({ profile, project, setToast, setKioskActive, onClose }) {
  return html`
    <section className="space-y-4">
      <div className="vp-panel rounded-3xl border border-warning/35 p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-warning">Admin Student Preview</p>
            <h1 className="mt-1 text-2xl font-black text-white">Previewing ${project.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              You are still signed in as an admin. This preview uses admin permissions so you can test the student workflow without a real student account.
            </p>
          </div>
          <${Button} icon=${X} variant="ghost" onClick=${onClose}>Exit preview</${Button}>
        </div>
      </div>
      <${FilmingWorkspace}
        profile=${profile}
        project=${project}
        setToast=${setToast}
        setKioskActive=${setKioskActive}
        previewMode=${true}
      />
    </section>
  `;
}

function StaffStudentPeriodPreview({ profile, period, projects, setToast, setKioskActive, onClose }) {
  const activeProjects = projects.filter((project) => project.status !== "archived");
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjects[0]?.id || "");

  useEffect(() => {
    if (!activeProjects.length) {
      setSelectedProjectId("");
      return;
    }
    if (!activeProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [activeProjects.map((project) => project.id).join("|"), selectedProjectId]);

  const selectedProject = activeProjects.find((project) => project.id === selectedProjectId);

  return html`
    <section className="space-y-4">
      <div className="vp-panel rounded-3xl border border-warning/35 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-warning">Student Preview</p>
            <h1 className="mt-1 text-2xl font-black text-white">${period.periodName}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Preview the selected period exactly from the student workflow area while staying signed in as staff.
            </p>
          </div>
          <${Button} icon=${X} variant="ghost" onClick=${onClose}>Exit preview</${Button}>
        </div>
      </div>

      ${activeProjects.length > 1
        ? html`
            <div className="vp-panel rounded-3xl p-4">
              <label className="grid gap-2 text-sm font-bold text-slate-300">
                Preview project
                <${Select}
                  value=${selectedProjectId}
                  onChange=${(event) => setSelectedProjectId(event.currentTarget.value)}
                >
                  ${activeProjects.map(
                    (project) => html`
                      <option key=${project.id} value=${project.id}>
                        ${project.title} - ${projectGroupLabel(project)}
                      </option>
                    `,
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
              previewMode=${true}
            />
          `
        : html`
            <${EmptyState}
              icon=${Camera}
              title="No active project to preview"
              body="Create a project for this period, then use the monitor preview again."
            />
          `}
    </section>
  `;
}

function FilmingWorkspace({ profile, project, setToast, setKioskActive, previewMode = false }) {
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
      ${previewMode
        ? html`
            <div className="rounded-3xl border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-amber-100">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-white">Student preview mode</p>
                  <p>
                    Student pages are being shown for testing while writes are still saved under your staff account.
                  </p>
                </div>
                <${Badge} icon=${Eye} className="text-amber-100">Preview</${Badge}>
              </div>
            </div>
          `
        : null}
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
            <p className="mt-1 font-black text-white">${projectGroupLabel(project)}</p>
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

        ${project.groups?.length
          ? html`
              <div className="mt-4 rounded-2xl bg-slate-950/35 p-3 ring-1 ring-slate-700/70">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Project groups</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  ${project.groups.map(
                    (group) => html`
                      <div key=${group.id} className="rounded-xl bg-slate-950/45 p-3">
                        <p className="font-black text-white">${group.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          ${group.assignedStudentEmails.length
                            ? group.assignedStudentEmails.map(titleFromEmail).join(", ")
                            : "No students assigned yet"}
                        </p>
                      </div>
                    `,
                  )}
                </div>
              </div>
            `
          : null}

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

function ManualPeriodEnrollmentForm({ profile, periods, enrollments, setToast }) {
  const activePeriods = getActivePeriods(periods);
  const [form, setForm] = useState(() => ({
    email: "",
    studentName: "",
    periodId: activePeriods[0]?.id || "",
  }));
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!activePeriods.length) return;
    setForm((current) =>
      current.periodId && activePeriods.some((period) => period.id === current.periodId)
        ? current
        : { ...current, periodId: activePeriods[0].id },
    );
  }, [activePeriods.map((period) => period.id).join("|")]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const selectedPeriod = activePeriods.find((period) => period.id === form.periodId);
  const selectedEnrollments = selectedPeriod
    ? activeEnrollmentsForPeriod(enrollments, selectedPeriod.id)
    : [];

  const addStudentToPeriod = async (event) => {
    event.preventDefault();
    setFormError("");
    const studentEmail = normalizeEmail(form.email);
    if (!selectedPeriod) {
      setFormError("Choose an active period.");
      return;
    }
    if (!isValidEmail(studentEmail) || !isStudentEmail(studentEmail)) {
      setFormError("Use a valid @student.doralacademynv.org email address.");
      return;
    }

    const existingEnrollment = enrollments.find(
      (enrollment) =>
        enrollment.periodId === selectedPeriod.id &&
        normalizeEmail(enrollment.studentEmail) === studentEmail,
    );
    setBusy(true);
    try {
      const enrollmentId = canonicalEnrollmentId(selectedPeriod.id, studentEmail);
      await setDoc(
        doc(db, "periodEnrollments", enrollmentId),
        {
          enrollmentId,
          studentId: studentEmail,
          studentEmail,
          studentName:
            safeText(form.studentName) ||
            safeText(existingEnrollment?.studentName) ||
            titleFromEmail(studentEmail),
          periodId: selectedPeriod.id,
          periodName: selectedPeriod.periodName,
          courseName: selectedPeriod.courseName || "",
          teacherId: selectedPeriod.teacherId || "",
          teacherEmail: selectedPeriod.teacherEmail || "",
          teacherName: selectedPeriod.teacherName || "",
          joinCodeLowercase: "manual",
          active: true,
          joinedAt: serverTimestamp(),
          removedAt: "",
        },
        { merge: true },
      );

      const userRef = doc(db, "videoUsers", studentEmail);
      const userSnapshot = await getDoc(userRef);
      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          email: studentEmail,
          role: VIDEO_ROLES.STUDENT,
          active: true,
          createdAt: serverTimestamp(),
          createdBy: profile.email,
          updatedAt: serverTimestamp(),
        });
      }

      setForm({ email: "", studentName: "", periodId: selectedPeriod.id });
      setToast(
        existingEnrollment?.active !== false
          ? `${studentEmail} is active in ${selectedPeriod.periodName}; roster refreshed`
          : `${studentEmail} added to ${selectedPeriod.periodName}`,
      );
    } catch (addError) {
      setFormError(addError.message);
    } finally {
      setBusy(false);
    }
  };

  return html`
    <section className="vp-panel rounded-3xl p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Add student to period</h2>
          <p className="text-sm text-slate-400">
            Manually place a student into a class period without using the join code.
          </p>
        </div>
        <${Badge} icon=${LayoutGrid}>${activePeriods.length} active periods</${Badge}>
      </div>

      ${activePeriods.length === 0
        ? html`
            <p className="rounded-2xl bg-slate-950/42 p-3 text-sm text-slate-400">
              Create an active period before adding students manually.
            </p>
          `
        : html`
            <form onSubmit=${addStudentToPeriod} className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
              <label className="grid gap-1 text-sm font-bold text-slate-300">
                Period
                <${Select}
                  value=${form.periodId}
                  onChange=${(event) => update("periodId", event.currentTarget.value)}
                >
                  ${activePeriods.map(
                    (period) => html`
                      <option key=${period.id} value=${period.id}>
                        ${period.periodName}${period.courseName ? ` - ${period.courseName}` : ""}
                      </option>
                    `,
                  )}
                </${Select}>
              </label>
              <label className="grid gap-1 text-sm font-bold text-slate-300">
                Student name
                <${TextInput}
                  value=${form.studentName}
                  onInput=${(event) => update("studentName", event.currentTarget.value)}
                  placeholder="Optional"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold text-slate-300">
                Student email
                <${TextInput}
                  value=${form.email}
                  onInput=${(event) => update("email", event.currentTarget.value)}
                  placeholder="student@student.doralacademynv.org"
                />
              </label>
              <div className="flex items-end">
                <${Button} icon=${UserPlus} type="submit" disabled=${busy} className="w-full">
                  ${busy ? "Adding..." : "Add to period"}
                </${Button}>
              </div>
            </form>
          `}

      ${formError ? html`<p className="mt-3 rounded-xl bg-alert/10 p-3 text-sm text-red-200">${formError}</p>` : null}
      ${selectedPeriod
        ? html`
            <div className="mt-4 rounded-2xl bg-slate-950/35 p-3 ring-1 ring-slate-700/70">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-white">${selectedPeriod.periodName}</p>
                  <p className="text-sm text-slate-400">${selectedPeriod.courseName || "No course name"}</p>
                </div>
                <${Badge} icon=${Users}>${selectedEnrollments.length} enrolled</${Badge}>
              </div>
              ${selectedEnrollments.length
                ? html`
                    <div className="mt-3 flex flex-wrap gap-2">
                      ${selectedEnrollments.slice(0, 10).map(
                        (enrollment) => html`
                          <span key=${enrollment.id} className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black text-slate-300 ring-1 ring-slate-700/70">
                            <span className="block text-white">${enrollment.studentName || titleFromEmail(enrollment.studentEmail)}</span>
                            <span className="block font-semibold text-slate-500">${enrollment.studentEmail}</span>
                          </span>
                        `,
                      )}
                      ${selectedEnrollments.length > 10
                        ? html`<span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-700/70">+${selectedEnrollments.length - 10} more</span>`
                        : null}
                    </div>
                  `
                : html`<p className="mt-3 text-sm text-slate-500">No students are enrolled in this period yet.</p>`}
            </div>
          `
        : null}
    </section>
  `;
}

function UserManagement({ profile, users, loading, error, setToast, periods = [], enrollments = [] }) {
  const [form, setForm] = useState({ email: "", role: VIDEO_ROLES.STUDENT });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const requiredAdmins = REQUIRED_VIDEO_ADMIN_EMAILS.map((email) => ({
    id: `required-${email}`,
    email,
    role: VIDEO_ROLES.ADMIN,
    active: true,
    required: true,
  }));
  const visibleUsers = [
    ...requiredAdmins,
    ...users.filter(
      (user) => !requiredAdmins.some((requiredAdmin) => requiredAdmin.email === user.email),
    ),
  ];

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

      <${ManualPeriodEnrollmentForm}
        profile=${profile}
        periods=${periods}
        enrollments=${enrollments}
        setToast=${setToast}
      />

      ${error ? html`<p className="rounded-xl bg-alert/10 p-3 text-sm text-red-200">${error}</p>` : null}
      ${loading
        ? html`<${EmptyState} icon=${Users} title="Loading users" />`
        : html`
            <div className="grid gap-3">
              ${visibleUsers.map(
                (user) => html`
                  <article key=${user.email} className="vp-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-white">${user.email}</p>
                      <p className="text-sm text-slate-400">
                        ${roleLabel(user.role)} - ${user.required ? "built in" : user.active ? "active" : "disabled"}
                      </p>
                    </div>
                    ${user.required
                      ? html`<${Badge} icon=${ShieldCheck}>Built in</${Badge}>`
                      : html`
                          <${Button} variant=${user.active ? "danger" : "success"} onClick=${() => toggleUser(user)}>
                            ${user.active ? "Disable" : "Enable"}
                          </${Button}>
                        `}
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
  const [previewProjectId, setPreviewProjectId] = useState("");
  const [previewPeriodId, setPreviewPeriodId] = useState("");
  const [selectedPeriodId, setSelectedPeriodIdState] = useState(() =>
    window.sessionStorage.getItem(PERIOD_SESSION_KEY) || "",
  );
  const [toast, setToast] = useState("");
  const [kioskActive, setKioskActive] = useState(false);
  const {
    enrollments,
    loading: enrollmentsLoading,
    error: enrollmentsError,
  } = usePeriodEnrollments(profile);
  const { periods, loading: periodsLoading, error: periodsError } = usePeriods(profile, enrollments);
  const { projects, loading: projectsLoading, error: projectsError } = useVideoProjects(
    profile,
    enrollments,
    periods,
  );
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

  useEffect(() => {
    if (!isVideoAdmin(profile)) setPreviewProjectId("");
  }, [profile?.role]);

  useEffect(() => {
    if (!isVideoAdmin(profile) && !isVideoTeacher(profile)) setPreviewPeriodId("");
  }, [profile?.role]);

  const activeTeacherPeriods = getActivePeriods(periods);

  useEffect(() => {
    if (!isVideoAdmin(profile) && !isVideoTeacher(profile)) {
      setSelectedPeriodIdState("");
      return;
    }
    if (!activeTeacherPeriods.length) {
      setSelectedPeriodIdState("");
      return;
    }
    if (!activeTeacherPeriods.some((period) => period.id === selectedPeriodId)) {
      const nextPeriodId = activeTeacherPeriods[0].id;
      setSelectedPeriodIdState(nextPeriodId);
      window.sessionStorage.setItem(PERIOD_SESSION_KEY, nextPeriodId);
    }
  }, [activeTeacherPeriods.map((period) => period.id).join("|"), profile?.role, selectedPeriodId]);

  const setSelectedPeriodId = (periodId) => {
    setSelectedPeriodIdState(periodId);
    if (periodId) window.sessionStorage.setItem(PERIOD_SESSION_KEY, periodId);
    else window.sessionStorage.removeItem(PERIOD_SESSION_KEY);
  };

  if (loading) return html`<${LoadingScreen} />`;
  if (!user) return html`<${VideoLogin} error=${error} />`;
  if (!hasVideoAccess(profile)) return html`<${AccessDeniedScreen} profile=${profile} error=${error} />`;

  const activeView = view || defaultViewForProfile(profile);
  const previewProject = isVideoAdmin(profile)
    ? projects.find((project) => project.id === previewProjectId)
    : null;
  const previewPeriod =
    isVideoAdmin(profile) || isVideoTeacher(profile)
      ? getActivePeriods(periods).find((period) => period.id === previewPeriodId)
      : null;
  const previewPeriodProjects = previewPeriod
    ? projects.filter((project) => projectBelongsToPeriod(project, previewPeriod.id))
    : [];
  const selectView = (nextView) => {
    setPreviewProjectId("");
    setPreviewPeriodId("");
    setView(nextView);
  };
  let content = null;

  if (previewPeriod) {
    content = html`
      <${StaffStudentPeriodPreview}
        profile=${profile}
        period=${previewPeriod}
        projects=${previewPeriodProjects}
        setToast=${setToast}
        setKioskActive=${setKioskActive}
        onClose=${() => setPreviewPeriodId("")}
      />
    `;
  } else if (previewProject) {
    content = html`
      <${AdminStudentPreview}
        profile=${profile}
        project=${previewProject}
        setToast=${setToast}
        setKioskActive=${setKioskActive}
        onClose=${() => setPreviewProjectId("")}
      />
    `;
  } else if (activeView === "filming" && isVideoStudent(profile)) {
    content = html`
      <${StudentFilmingHome}
        profile=${profile}
        projects=${projects}
        loading=${projectsLoading}
        error=${projectsError}
        enrollments=${enrollments}
        periods=${periods}
        enrollmentsLoading=${enrollmentsLoading}
        enrollmentsError=${enrollmentsError}
        periodsLoading=${periodsLoading}
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
        error=${projectsError || periodsError || enrollmentsError || profilesError}
        studentProfiles=${studentProfiles}
        periods=${periods}
        enrollments=${enrollments}
        selectedPeriodId=${selectedPeriodId}
        setSelectedPeriodId=${setSelectedPeriodId}
        onPreviewPeriod=${(periodId) => {
          setPreviewProjectId("");
          setPreviewPeriodId(periodId);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    `;
  } else if (activeView === "periods" && (isVideoTeacher(profile) || isVideoAdmin(profile))) {
    content = html`
      <${PeriodManager}
        profile=${profile}
        periods=${periods}
        enrollments=${enrollments}
        projects=${projects}
        loading=${periodsLoading}
        error=${periodsError || enrollmentsError}
        setToast=${setToast}
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
        onPreviewStudent=${(projectId) => {
          setPreviewPeriodId("");
          setPreviewProjectId(projectId);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        periods=${periods}
        enrollments=${enrollments}
      />
    `;
  } else if (activeView === "users" && isVideoAdmin(profile)) {
    content = html`
      <${UserManagement}
        profile=${profile}
        users=${users}
        loading=${usersLoading}
        error=${usersError || periodsError || enrollmentsError}
        setToast=${setToast}
        periods=${periods}
        enrollments=${enrollments}
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
      setView=${selectView}
      kioskActive=${kioskActive}
    >
      ${content}
    </${VideoShell}>
    <${Toast} message=${toast} />
  `;
}

createRoot(document.getElementById("video-production-root")).render(html`<${VideoProductionApp} />`);
