import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import { Pool } from 'pg';
import multer from 'multer';
import ImageKit from 'imagekit';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || '';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const KNOWN_WEAK_SECRETS = new Set([
  'change-this-secret-in-production',
  'replace-with-a-long-random-secret',
  '',
]);
// ── Enforce a strong JWT secret in production ────────────────────────────────
// A weak or default secret lets anyone forge an admin token. Refuse to boot
// rather than silently running insecure.
if (IS_PROD && (KNOWN_WEAK_SECRETS.has(JWT_SECRET) || JWT_SECRET.length < 32)) {
  throw new Error(
    'Insecure JWT_SECRET. Set a random secret of at least 32 characters in your ' +
    'Vercel environment variables before deploying to production.'
  );
}
const ENABLE_STARTUP_INTEGRITY_CHECK = process.env.ENABLE_STARTUP_INTEGRITY_CHECK
  ? process.env.ENABLE_STARTUP_INTEGRITY_CHECK !== 'false'
  : !IS_PROD;
const FRONTEND_ORIGINS = [
  ...(process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean),
  ...[process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .filter(Boolean)
    .map((host) => host.startsWith('http') ? host : `https://${host}`),
];
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'rotaractclubofswoyambhu';
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION || 'content';
const POSTGRES_BACKUP_URL = process.env.POSTGRES_BACKUP_URL || '';
const POSTGRES_BACKUP_TABLE = process.env.POSTGRES_BACKUP_TABLE || 'website_content';
// STRICT_DUAL_WRITE: both DBs must succeed on every write.
// Set STRICT_DUAL_WRITE=false in .env to revert to soft-fallback mode.
const STRICT_DUAL_WRITE = process.env.STRICT_DUAL_WRITE !== 'false';
const AUTH_COOKIE_NAME = 'admin_session';

const DOC_ID = 'website-content';

const websiteDefaults = {
  heroEn: 'Rotaract Club\nof Swoyambhu',
  heroNe: 'स्वयम्भू\nरोटर्याक्ट क्लब',
  heroStats: [
    { value: '25+', labelEn: 'Years of Service', labelNe: 'सेवाका वर्ष' },
    { value: '150+', labelEn: 'Active Members', labelNe: 'सक्रिय सदस्य' },
    { value: '40+', labelEn: 'Projects / Year', labelNe: 'वार्षिक परियोजना' },
  ],
  aboutEn: 'Rotaract is a global movement of young leaders who are developing innovative solutions to the world\'s most pressing challenges. We bring together adults ages 18–30 to take action in their communities, develop their leadership and professional skills, and have fun.\n\nThe Rotaract Club of Swoyambhu is deeply rooted in the spiritual and cultural heart of Kathmandu. Inspired by the wisdom eyes of Swoyambhu, we aim to serve with clarity, compassion, and a profound respect for our heritage.',
  aboutImage: '',
  contactImage: '',
  contactQuoteEn: 'Service Above Self — in the shadow of the Swoyambhu Stupa.',
  contactQuoteNe: 'स्वार्थ भन्दा माथि सेवा — स्वयम्भू स्तूपको छहारीमा।',
  aboutQuoteEn: 'Service Above Self — inspired by the wisdom eyes of Swoyambhu, we rise with clarity and compassion.',
  aboutQuoteNe: 'स्वार्थ भन्दा माथि सेवा — स्वयम्भूका ज्ञान नेत्रबाट प्रेरित, हामी स्पष्टता र करुणाका साथ अगाडि बढ्छौं।',
  aboutNe: 'रोटर्याक्ट युवा नेताहरूको एक विश्वव्यापी आन्दोलन हो जो संसारका सबैभन्दा ठूला चुनौतीहरूको लागि अभिनव समाधानहरू विकास गर्दैछ। हामी समुदायमा कार्य गर्न, नेतृत्व र व्यावसायिक सीपहरू विकास गर्न १८–३० वर्षका युवाहरूलाई एकसाथ ल्याउँछौं।\n\nस्वयम्भू रोटर्याक्ट क्लब काठमाडौंको आध्यात्मिक र सांस्कृतिक केन्द्रमा गहिरो जरा गाडेको छ। स्वयम्भूका ज्ञान नेत्रहरूबाट प्रेरित भएर, हामी स्पष्टता, करुणा र हाम्रो सम्पदाप्रति गहिरो सम्मानका साथ सेवा गर्ने लक्ष्य राख्छौं।',
  team: [
    { id: '1', name: 'Rtr. Subina Magar', roleEn: 'President', roleNe: 'अध्यक्ष', imgUrl: '/src/assets/images/president.jpg' },
    { id: '2', name: 'Rtr. Darsana dd', roleEn: 'Vice President', roleNe: 'उपाध्यक्ष', imgUrl: '/src/assets/images/img4.jpg' },
    { id: '3', name: 'Rtr. Jenisha Gautam', roleEn: 'Secretary', roleNe: 'सचिव', imgUrl: '/src/assets/images/Secretary.jpg' },
    { id: '4', name: 'Rtr. Smriti Adhikari', roleEn: 'Professional Development Chair', roleNe: 'कोषाध्यक्ष', imgUrl: '/src/assets/images/pdc.jpg' },
  ],
  initiatives: [
    { id: '1', titleEn: 'Community Service', titleNe: 'समाज सेवा', desc: 'Grassroots level projects focusing on education, health, and sustainable environment in the local Swoyambhu area and beyond.', descNe: 'स्थानीय स्वयम्भू क्षेत्र र त्यसभन्दा बाहिरका शिक्षा, स्वास्थ्य र दिगो वातावरणमा केन्द्रित जमिनी तहका परियोजनाहरू।', iconSvg: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { id: '2', titleEn: 'Professional Development', titleNe: 'व्यावसायिक विकास', desc: 'Workshops, mentorship programs, and networking events designed to elevate the skills and career trajectories of our youth.', descNe: 'युवाहरूको सीप र करियर यात्रा उकास्न डिजाइन गरिएका कार्यशाला, परामर्श कार्यक्रम र नेटवर्किङ कार्यक्रमहरू।', iconSvg: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z' },
    { id: '3', titleEn: 'Cultural Preservation', titleNe: 'संस्कृति संरक्षण', desc: 'Initiatives dedicated to maintaining the aesthetic and spiritual heritage of Swoyambhu, from clean-ups to awareness campaigns.', descNe: 'स्वयम्भूको सौन्दर्य र आध्यात्मिक सम्पदा कायम राख्न समर्पित पहलहरू — सफाइदेखि चेतना अभियानसम्म।', iconSvg: 'M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm5 15h-2v-6H9v6H7v-7.81l5-4.5 5 4.5V18z' },
  ],
  events: [
    { id: '1', day: '15', month: 'OCT', titleEn: 'Heritage Clean-up Drive', titleNe: 'सम्पदा सरसफाई अभियान', desc: 'Join us as we clean the surroundings of the Swoyambhu Stupa to preserve its sanctity and beauty.' },
    { id: '2', day: '28', month: 'OCT', titleEn: 'Youth Leadership Workshop', titleNe: 'युवा नेतृत्व कार्यशाला', desc: 'A comprehensive session on public speaking and organizational leadership for aspiring youth.' },
    { id: '3', day: '05', month: 'NOV', titleEn: 'General Meeting & Fellowship', titleNe: 'साधारण सभा र फेलोशिप', desc: 'Our monthly meeting followed by a cultural exchange dinner. Open to all prospective members.' },
  ],
  gallery: [
    { id: '1', imgUrl: '/src/assets/images/img3.jpg', captionEn: 'Heritage Walk 2023', captionNe: 'सम्पदा पदयात्रा २०२३' },
    { id: '2', imgUrl: '/src/assets/images/img2.png', captionEn: 'Blood Donation Drive', captionNe: 'रक्तदान कार्यक्रम' },
    { id: '3', imgUrl: '/src/assets/images/img4.jpg', captionEn: 'Youth Workshop', captionNe: 'युवा कार्यशाला' },
    { id: '4', imgUrl: '/src/assets/images/img1.png', captionEn: 'Cultural Event', captionNe: 'सांस्कृतिक कार्यक्रम' },
  ],
  albums: [],
  eventsList: [],
  highlights: [],
  timestamp: '',
};

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'dummy_public_key',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'dummy_private_key',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/dummy',
});

const upload = multer({ storage: multer.memoryStorage() });

// ── ImageKit cleanup helpers ────────────────────────────────────────────────
// Extract the managed file path (e.g. /rotaract/img.jpg) from a stored image URL.
function extractImageKitPath(url) {
  try {
    const base = process.env.IMAGEKIT_URL_ENDPOINT;
    if (!base || !url) return null;
    const normBase = base.endsWith('/') ? base : `${base}/`;
    let clean = String(url).split('?')[0];
    // Strip ImageKit transformation prefixes like /tr:w-800,h-600/
    clean = clean.replace(/\/tr:[^/]+\//g, '/');
    let filePath;
    if (clean.startsWith(normBase)) {
      filePath = `/${clean.slice(normBase.length)}`.replace(/\/{2,}/g, '/');
    } else {
      // Tolerate old-format URLs (e.g. https://ik.imagekit.io/<id>/rotaract/...) that
      // predate a urlEndpoint path-prefix change.
      const idx = clean.indexOf('/rotaract/');
      filePath = idx >= 0 ? clean.slice(idx) : null;
    }
    return filePath && filePath.startsWith('/rotaract/') ? filePath : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the ImageKit file entry for an app-managed path by listing the
 * /rotaract folder (ImageKit's `path` search field matches folders, not files,
 * so a full-path searchQuery would never match). Returns the file or null.
 */
async function findImageKitFile(filePath) {
  if (!filePath || !filePath.startsWith('/rotaract/')) return null;
  try {
    const files = await imagekit.listFiles({ path: '/rotaract', limit: 1000 });
    return Array.isArray(files)
      ? files.find((f) => f.filePath === filePath || (f.url || '').split('?')[0].endsWith(filePath))
      : null;
  } catch (err) {
    logWarn(`ImageKit file lookup failed (non-fatal): ${err.message}`);
    return null;
  }
}

/**
 * Best-effort delete of an app-uploaded image from ImageKit.
 * ImageKit's delete API needs a fileId, so we resolve the path via the list API
 * first, then delete by fileId. Never throws — returns a result object.
 */
async function deleteImageFromImageKit(url) {
  const filePath = extractImageKitPath(url);
  if (!filePath) return { deleted: false, reason: 'NOT_MANAGED' };

  const ikPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  const isIkConfigured =
    ikPrivateKey && !['your_private_key', 'dummy_private_key'].includes(ikPrivateKey);
  if (!isIkConfigured) return { deleted: false, reason: 'IMAGEKIT_NOT_CONFIGURED' };

  try {
    const match = await findImageKitFile(filePath);
    if (!match) return { deleted: false, reason: 'NOT_FOUND' };
    await imagekit.deleteFile(match.fileId);
    // Drop the dedup hash so a re-upload of the same image does a clean fresh
    // upload instead of reusing a dead URL.
    if (postgresPool) {
      try {
        await postgresPool.query('DELETE FROM image_hashes WHERE url = $1', [url]);
      } catch (hashErr) {
        logWarn(`Hash cleanup failed (non-fatal): ${hashErr.message}`);
      }
    }
    logInfo(`Deleted image from ImageKit: ${filePath} (${match.fileId})`);
    return { deleted: true, fileId: match.fileId };
  } catch (err) {
    logWarn(`ImageKit delete failed (non-fatal): ${err.message}`);
    return { deleted: false, reason: err.message };
  }
}

/**
 * Check whether an app-uploaded file still exists on ImageKit.
 * Returns true when we cannot get a definitive answer (avoid blocking uploads
 * on transient API errors); returns false only when the file is confirmed gone.
 */
async function isImageKitFileAlive(filePath) {
  const ikPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  const isIkConfigured =
    ikPrivateKey && !['your_private_key', 'dummy_private_key'].includes(ikPrivateKey);
  if (!isIkConfigured) return true;
  try {
    const files = await imagekit.listFiles({ path: '/rotaract', limit: 1000 });
    return (
      Array.isArray(files) &&
      files.some((f) => f.filePath === filePath || (f.url || '').split('?')[0].endsWith(filePath))
    );
  } catch (err) {
    logWarn(`ImageKit liveness check failed (non-fatal, reusing hash): ${err.message}`);
    return true;
  }
}

/**
 * Count how many times a URL appears anywhere in the current website data.
 * Used to protect shared images: a file is only removed from ImageKit once it
 * is no longer referenced by any page/section.
 */
function countImageReferences(obj, url) {
  let count = 0;
  const walk = (value) => {
    if (typeof value === 'string') {
      if (value === url) count++;
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) walk(value[key]);
    }
  };
  walk(obj);
  return count;
}

let mongoClient;
let mongoCollection = null;
let postgresPool = null;
let activeStorage = 'uninitialized';
// Two separate in-memory caches with 5-second TTL:
//   cachedStorePublic — websiteData only (no history). Used by public routes.
//   cachedStoreFull   — full document including history. Used by admin writes.
let cachedStore = null;          // alias kept for writeStore compatibility
let cachedStoreAt = 0;
let cachedStoreFull = null;
let cachedStoreFullAt = 0;
const CACHE_TTL_MS = 60_000; // 60 s — client invalidates on every save so stale reads are safe

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (FRONTEND_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

let storageInitialized = false;

// Ensure storage is connected in serverless environments
app.use(async (req, res, next) => {
  if (!storageInitialized) {
    try {
      await initStorage();
      storageInitialized = true;
      logInfo(`Admin API running. Active storage: ${activeStorage}`);
    } catch (error) {
      logError(`Failed to initialize storage: ${error.message}`);
      return res.status(500).json({ message: 'Database connection failed' });
    }
  }
  next();
});

const ansi = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function logInfo(message) {
  console.log(`${ansi.cyan}[api]${ansi.reset} ${message}`);
}

function logWarn(message) {
  console.warn(`${ansi.yellow}[warn]${ansi.reset} ${message}`);
}

function logError(message) {
  console.error(`${ansi.red}[error]${ansi.reset} ${message}`);
}

function logIntegrity(message) {
  console.log(`${ansi.magenta}[integrity]${ansi.reset} ${message}`);
}

function normalizeWebsiteData(data) {
  if (!data || typeof data !== 'object') {
    return { ...websiteDefaults };
  }

  return {
    ...websiteDefaults,
    ...data,
    heroEn: data.heroEn ?? data.heroTitleEn ?? '',
    heroNe: data.heroNe ?? data.heroTitleNe ?? '',
    aboutEn: data.aboutEn ?? '',
    aboutNe: data.aboutNe ?? '',
    aboutImage: data.aboutImage ?? '',
    contactImage: data.contactImage ?? '',
    contactQuoteEn: data.contactQuoteEn ?? '',
    contactQuoteNe: data.contactQuoteNe ?? '',
    aboutQuoteEn: data.aboutQuoteEn ?? '',
    aboutQuoteNe: data.aboutQuoteNe ?? '',
    eventsList: Array.isArray(data.eventsList) ? data.eventsList : [],
    albums: Array.isArray(data.albums) ? data.albums : [],
    highlights: Array.isArray(data.highlights) ? data.highlights : [],
    timestamp: data.timestamp ?? '',
  };
}

function normalizeStore(store) {
  return {
    websiteData: normalizeWebsiteData(store?.websiteData),
    history: Array.isArray(store?.history) ? store.history : [],
  };
}

/**
 * compareStores — compares websiteData from both databases.
 * Strips `timestamp` before comparing to avoid false mismatches
 * caused by millisecond-level differences.
 */
function compareStores(mongoStore, pgStore) {
  const strip = (data) => {
    const { timestamp, ...rest } = normalizeWebsiteData(data);
    return rest;
  };

  const mongoJson = JSON.stringify(strip(mongoStore?.websiteData));
  const pgJson    = JSON.stringify(strip(pgStore?.websiteData));

  return {
    identical:      mongoJson === pgJson,
    mongoTimestamp: mongoStore?.websiteData?.timestamp || '(none)',
    pgTimestamp:    pgStore?.websiteData?.timestamp    || '(none)',
  };
}

/**
 * restoreMongoFromPostgres — overwrites the MongoDB document
 * with the authoritative data from PostgreSQL.
 */
async function restoreMongoFromPostgres(pgStore) {
  if (!mongoCollection) throw new Error('MongoDB not connected');
  const safeStore = normalizeStore(pgStore);
  await mongoCollection.updateOne(
    { _id: DOC_ID },
    { $set: safeStore },
    { upsert: true }
  );
}

function isSafeSqlIdentifier(value) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

function sanitizeWebUrl(value) {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed, 'https://example.com');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function sanitizeEventLink(event) {
  if (!event || typeof event !== 'object') return event;

  return {
    ...event,
    registrationLink: sanitizeWebUrl(event.registrationLink),
  };
}

function sanitizeEventsList(events) {
  return Array.isArray(events) ? events.map(sanitizeEventLink) : [];
}

function parseCookies(rawCookieHeader = '') {
  const cookies = {};
  rawCookieHeader.split(';').forEach((chunk) => {
    const [key, ...rest] = chunk.trim().split('=');
    if (!key) return;
    cookies[key] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

function setAuthCookie(res, token) {
  const maxAgeSeconds = 60 * 60 * 12;
  const cookieParts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (IS_PROD) {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function clearAuthCookie(res) {
  const cookieParts = [
    `${AUTH_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (IS_PROD) {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function getAuthToken(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies[AUTH_COOKIE_NAME]) {
    return cookies[AUTH_COOKIE_NAME];
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return '';
}

// ── URL pattern: allow https://, data:image/, absolute paths starting with / ──
const SAFE_URL_PATTERN = /^(https?:\/\/|data:image\/|\/)/;

function validateWebsitePayload(data) {
  if (!data || typeof data !== 'object') {
    return 'Invalid payload';
  }

  // ── Text field checks ──────────────────────────────────────────────────────
  const textChecks = [
    ['heroEn', 200],
    ['heroNe', 200],
    ['aboutEn', 4000],
    ['aboutNe', 4000],
    ['contactQuoteEn', 300],
    ['contactQuoteNe', 300],
    ['aboutQuoteEn', 300],
    ['aboutQuoteNe', 300],
  ];

  for (const [key, maxLen] of textChecks) {
    if (data[key] == null) continue;
    if (typeof data[key] !== 'string') {
      return `Invalid field: ${key}`;
    }
    if (data[key].length > maxLen) {
      return `${key} exceeds max length (${maxLen})`;
    }
  }

  // ── Image URL / data-URL checks ───────────────────────────────────────────
  const imageChecks = [
    ['aboutImage', 5000],
    ['contactImage', 5000],
  ];

  for (const [key, maxLen] of imageChecks) {
    if (data[key] == null) continue;
    if (typeof data[key] !== 'string') {
      return `Invalid field: ${key}`;
    }
    if (data[key].length > maxLen) {
      return `${key} exceeds max length (${maxLen})`;
    }
  }

  // ── Array field checks ─────────────────────────────────────────────────────
  const MAX_ITEMS = 20;

  if (data.heroStats != null) {
    if (!Array.isArray(data.heroStats)) return 'heroStats must be an array';
    if (data.heroStats.length > 12) return 'heroStats exceeds max items (12)';
    for (const [i, s] of data.heroStats.entries()) {
      if (!s || typeof s !== 'object') return `heroStats[${i}] is invalid`;
      if (s.value != null && (typeof s.value !== 'string' || s.value.length > 40)) return `heroStats[${i}].value is invalid`;
      if (s.labelEn != null && (typeof s.labelEn !== 'string' || s.labelEn.length > 100)) return `heroStats[${i}].labelEn is invalid`;
      if (s.labelNe != null && (typeof s.labelNe !== 'string' || s.labelNe.length > 100)) return `heroStats[${i}].labelNe is invalid`;
    }
  }

  if (data.team != null) {
    if (!Array.isArray(data.team)) return 'team must be an array';
    if (data.team.length > MAX_ITEMS) return `team exceeds max items (${MAX_ITEMS})`;
    for (const [i, m] of data.team.entries()) {
      if (!m || typeof m !== 'object') return `team[${i}] is invalid`;
      if (m.name != null && (typeof m.name !== 'string' || m.name.length > 200)) return `team[${i}].name is invalid`;
      if (m.nameNe != null && (typeof m.nameNe !== 'string' || m.nameNe.length > 200)) return `team[${i}].nameNe is invalid`;
      if (m.roleEn != null && (typeof m.roleEn !== 'string' || m.roleEn.length > 200)) return `team[${i}].roleEn is invalid`;
      if (m.roleNe != null && (typeof m.roleNe !== 'string' || m.roleNe.length > 200)) return `team[${i}].roleNe is invalid`;
      if (m.imgUrl != null && (typeof m.imgUrl !== 'string' || !SAFE_URL_PATTERN.test(m.imgUrl))) return `team[${i}].imgUrl is invalid`;
    }
  }

  if (data.gallery != null) {
    if (!Array.isArray(data.gallery)) return 'gallery must be an array';
    if (data.gallery.length > MAX_ITEMS) return `gallery exceeds max items (${MAX_ITEMS})`;
    for (const [i, g] of data.gallery.entries()) {
      if (!g || typeof g !== 'object') return `gallery[${i}] is invalid`;
      if (g.captionEn != null && (typeof g.captionEn !== 'string' || g.captionEn.length > 300)) return `gallery[${i}].captionEn is invalid`;
      if (g.captionNe != null && (typeof g.captionNe !== 'string' || g.captionNe.length > 300)) return `gallery[${i}].captionNe is invalid`;
      if (g.imgUrl != null && (typeof g.imgUrl !== 'string' || !SAFE_URL_PATTERN.test(g.imgUrl))) return `gallery[${i}].imgUrl is invalid`;
      if (g.albumId != null && (typeof g.albumId !== 'string' || g.albumId.length > 100)) return `gallery[${i}].albumId is invalid`;
    }
  }

  if (data.albums != null) {
    if (!Array.isArray(data.albums)) return 'albums must be an array';
    if (data.albums.length > MAX_ITEMS) return `albums exceeds max items (${MAX_ITEMS})`;
    for (const [i, a] of data.albums.entries()) {
      if (!a || typeof a !== 'object') return `albums[${i}] is invalid`;
      if (a.id == null || typeof a.id !== 'string' || a.id.length > 100) return `albums[${i}].id is invalid`;
      if (a.titleEn != null && (typeof a.titleEn !== 'string' || a.titleEn.length > 300)) return `albums[${i}].titleEn is invalid`;
      if (a.titleNe != null && (typeof a.titleNe !== 'string' || a.titleNe.length > 300)) return `albums[${i}].titleNe is invalid`;
      if (a.description != null && (typeof a.description !== 'string' || a.description.length > 1000)) return `albums[${i}].description is invalid`;
      if (a.descriptionNe != null && (typeof a.descriptionNe !== 'string' || a.descriptionNe.length > 1000)) return `albums[${i}].descriptionNe is invalid`;
      if (a.coverImage != null && (typeof a.coverImage !== 'string' || !SAFE_URL_PATTERN.test(a.coverImage))) return `albums[${i}].coverImage is invalid`;
      if (a.eventId != null && (typeof a.eventId !== 'string' || a.eventId.length > 100)) return `albums[${i}].eventId is invalid`;
    }
  }

  if (data.events != null) {
    if (!Array.isArray(data.events)) return 'events must be an array';
    if (data.events.length > MAX_ITEMS) return `events exceeds max items (${MAX_ITEMS})`;
    for (const [i, ev] of data.events.entries()) {
      if (!ev || typeof ev !== 'object') return `events[${i}] is invalid`;
      if (ev.titleEn != null && (typeof ev.titleEn !== 'string' || ev.titleEn.length > 300)) return `events[${i}].titleEn is invalid`;
      if (ev.titleNe != null && (typeof ev.titleNe !== 'string' || ev.titleNe.length > 300)) return `events[${i}].titleNe is invalid`;
      if (ev.desc != null && (typeof ev.desc !== 'string' || ev.desc.length > 1000)) return `events[${i}].desc is invalid`;
    }
  }

  if (data.initiatives != null) {
    if (!Array.isArray(data.initiatives)) return 'initiatives must be an array';
    if (data.initiatives.length > MAX_ITEMS) return `initiatives exceeds max items (${MAX_ITEMS})`;
    for (const [i, init] of data.initiatives.entries()) {
      if (!init || typeof init !== 'object') return `initiatives[${i}] is invalid`;
      if (init.titleEn != null && (typeof init.titleEn !== 'string' || init.titleEn.length > 300)) return `initiatives[${i}].titleEn is invalid`;
      if (init.titleNe != null && (typeof init.titleNe !== 'string' || init.titleNe.length > 300)) return `initiatives[${i}].titleNe is invalid`;
      if (init.desc != null && (typeof init.desc !== 'string' || init.desc.length > 1000)) return `initiatives[${i}].desc is invalid`;
      if (init.descNe != null && (typeof init.descNe !== 'string' || init.descNe.length > 1000)) return `initiatives[${i}].descNe is invalid`;
    }
  }

  if (data.highlights != null) {
    if (!Array.isArray(data.highlights)) return 'highlights must be an array';
    if (data.highlights.length > MAX_ITEMS) return `highlights exceeds max items (${MAX_ITEMS})`;
    for (const [i, h] of data.highlights.entries()) {
      if (!h || typeof h !== 'object') return `highlights[${i}] is invalid`;
      if (h.id == null || typeof h.id !== 'string' || h.id.length > 100) return `highlights[${i}].id is invalid`;
      if (h.title != null && (typeof h.title !== 'string' || h.title.length > 300)) return `highlights[${i}].title is invalid`;
      if (h.titleNe != null && (typeof h.titleNe !== 'string' || h.titleNe.length > 300)) return `highlights[${i}].titleNe is invalid`;
      if (h.description != null && (typeof h.description !== 'string' || h.description.length > 1000)) return `highlights[${i}].description is invalid`;
      if (h.badge != null && (typeof h.badge !== 'string' || h.badge.length > 100)) return `highlights[${i}].badge is invalid`;
      if (h.imageUrl != null && (typeof h.imageUrl !== 'string' || !SAFE_URL_PATTERN.test(h.imageUrl))) return `highlights[${i}].imageUrl is invalid`;
    }
  }

  return null;
}

async function connectPostgresBackup() {
  if (!POSTGRES_BACKUP_URL) {
    console.warn('[storage] POSTGRES_BACKUP_URL not set. PostgreSQL backup disabled.');
    return;
  }

  try {
    if (!isSafeSqlIdentifier(POSTGRES_BACKUP_TABLE)) {
      throw new Error('POSTGRES_BACKUP_TABLE must be a safe SQL identifier');
    }

    postgresPool = new Pool({
      connectionString: POSTGRES_BACKUP_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });

    await postgresPool.query(`
      CREATE TABLE IF NOT EXISTS ${POSTGRES_BACKUP_TABLE} (
        id TEXT PRIMARY KEY,
        website_data JSONB NOT NULL,
        history JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await postgresPool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        permissions JSONB NOT NULL DEFAULT '[]',
        is_temporary_password BOOLEAN NOT NULL DEFAULT false,
        reset_code TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        passkeys JSONB NOT NULL DEFAULT '[]',
        current_challenge TEXT
      )
    `);

    // Ensure email and scheduled_for_deletion_at columns exist on existing installations
    await postgresPool.query(`
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS scheduled_for_deletion_at TIMESTAMPTZ;
    `);

    await postgresPool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        username TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await postgresPool.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        error_message TEXT NOT NULL,
        error_stack TEXT,
        error_code TEXT,
        endpoint TEXT,
        method TEXT,
        status_code INT,
        username TEXT,
        user_role TEXT,
        request_payload JSONB,
        response_data JSONB,
        client_info JSONB,
        user_notes TEXT,
        is_resolved BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await postgresPool.query(`
      CREATE TABLE IF NOT EXISTS event_subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Image deduplication: store sha256 → ImageKit URL mapping
    await postgresPool.query(`
      CREATE TABLE IF NOT EXISTS image_hashes (
        sha256 TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        original_name TEXT,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    logInfo(`PostgreSQL backup connected (table: ${POSTGRES_BACKUP_TABLE})`);
  } catch (error) {
    postgresPool = null;
    logWarn(`PostgreSQL backup unavailable. Reason: ${error.message}`);
  }
}

async function readFromPostgresBackup() {
  if (!postgresPool) {
    throw new Error('PostgreSQL backup is not configured');
  }

  const result = await postgresPool.query(
    `SELECT website_data, history FROM ${POSTGRES_BACKUP_TABLE} WHERE id = $1 LIMIT 1`,
    [DOC_ID]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return normalizeStore({
    websiteData: result.rows[0].website_data,
    history: result.rows[0].history,
  });
}

async function writeToPostgresBackup(store) {
  if (!postgresPool) {
    throw new Error('PostgreSQL backup is not configured');
  }

  const safeStore = normalizeStore(store);

  await postgresPool.query(
    `
      INSERT INTO ${POSTGRES_BACKUP_TABLE} (id, website_data, history, updated_at)
      VALUES ($1, $2::jsonb, $3::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        website_data = EXCLUDED.website_data,
        history = EXCLUDED.history,
        updated_at = NOW()
    `,
    [DOC_ID, JSON.stringify(safeStore.websiteData), JSON.stringify(safeStore.history)]
  );
}

async function connectMongo() {
  if (!MONGODB_URI) {
    logWarn('MONGODB_URI not set. MongoDB primary disabled.');
    return;
  }

  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      // ── Serverless-optimised connection pool ───────────────────────────────
      // Keep pool tiny: Vercel functions are short-lived and each instance
      // maintains its own pool — large pools waste Atlas free-tier connections.
      minPoolSize: 1,
      maxPoolSize: 5,
      maxIdleTimeMS: 30_000,       // recycle idle sockets after 30 s

      // ── Timeouts ──────────────────────────────────────────────────────────
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10_000,
      heartbeatFrequencyMS: 10_000, // check server health every 10 s

      // ── Wire compression — reduces payload size ~60 % for large JSON docs ─
      compressors: ['zlib'],

      // ── Read preference — serve reads from secondaries when available ──────
      readPreference: 'secondaryPreferred',
    });
    await mongoClient.connect();
    const db = mongoClient.db(MONGODB_DB_NAME);
    mongoCollection = db.collection(MONGODB_COLLECTION);
    activeStorage = 'mongodb';
    logInfo(`MongoDB connected (${MONGODB_DB_NAME}.${MONGODB_COLLECTION})`);
  } catch (error) {
    mongoCollection = null;
    logWarn(`MongoDB unavailable. Falling back to PostgreSQL backup. Reason: ${error.message}`);
  }
}

// readStore(includeHistory = false)
//   includeHistory=false → fetches only websiteData (faster, smaller payload)
//   includeHistory=true  → fetches full document including history (for admin writes)
async function readStore(includeHistory = false) {
  const now = Date.now();

  // Return from the appropriate cache if still fresh
  if (includeHistory) {
    if (cachedStoreFull && (now - cachedStoreFullAt) < CACHE_TTL_MS) return cachedStoreFull;
  } else {
    if (cachedStore && (now - cachedStoreAt) < CACHE_TTL_MS) return cachedStore;
  }

  if (mongoCollection) {
    try {
      const projection = includeHistory
        ? {}                                  // full document
        : { websiteData: 1, _id: 0 };        // lean — skip history array

      const doc = await mongoCollection.findOne({ _id: DOC_ID }, { projection });
      if (doc) {
        const store = normalizeStore(doc);
        if (includeHistory) {
          cachedStoreFull = store; cachedStoreFullAt = Date.now();
        } else {
          cachedStore = store; cachedStoreAt = Date.now();
        }
        activeStorage = 'mongodb';
        return store;
      }

      let seedStore = null;
      if (postgresPool) {
        seedStore = await readFromPostgresBackup();
      }

      if (!seedStore) {
        seedStore = { websiteData: { ...websiteDefaults }, history: [] };
      }

      await mongoCollection.updateOne({ _id: DOC_ID }, { $set: seedStore }, { upsert: true });
      const normalized = normalizeStore(seedStore);
      cachedStore = normalized;     cachedStoreAt = Date.now();
      cachedStoreFull = normalized; cachedStoreFullAt = Date.now();
      activeStorage = 'mongodb';
      return normalized;
    } catch (error) {
      logWarn(`MongoDB read failed, switching to PostgreSQL backup: ${error.message}`);
    }
  }

  if (postgresPool) {
    const backupStore = await readFromPostgresBackup();
    activeStorage = 'postgres-backup';
    const store = backupStore || { websiteData: { ...websiteDefaults }, history: [] };
    cachedStore = store;     cachedStoreAt = Date.now();
    cachedStoreFull = store; cachedStoreFullAt = Date.now();
    return store;
  }

  throw new Error('No storage provider available');
}

async function writeStore(store) {
  const safeStore = normalizeStore(store);

  if (STRICT_DUAL_WRITE) {
    // ── Strict mode: both databases must succeed ─────────────────────────────
    const writes = [];

    if (mongoCollection) {
      writes.push(
        mongoCollection.updateOne(
          { _id: DOC_ID },
          { $set: safeStore },
          { upsert: true }
        )
      );
    }

    if (postgresPool) {
      writes.push(writeToPostgresBackup(safeStore));
    }

    if (writes.length === 0) {
      throw new Error('No storage provider available');
    }

    // Throws if EITHER write fails — caller will return 500 to client.
    await Promise.all(writes);
    activeStorage = mongoCollection && postgresPool ? 'mongodb+postgres' : (mongoCollection ? 'mongodb' : 'postgres-backup');
    cachedStore = safeStore;     cachedStoreAt = Date.now();
    cachedStoreFull = safeStore; cachedStoreFullAt = Date.now();
    return;
  }

  // ── Soft-fallback mode (STRICT_DUAL_WRITE=false) ─────────────────────────
  if (mongoCollection) {
    try {
      await mongoCollection.updateOne(
        { _id: DOC_ID },
        { $set: safeStore },
        { upsert: true }
      );
      if (postgresPool) {
        await writeToPostgresBackup(safeStore);
      }
      activeStorage = 'mongodb';
      cachedStore = safeStore;     cachedStoreAt = Date.now();
      cachedStoreFull = safeStore; cachedStoreFullAt = Date.now();
      return;
    } catch (error) {
      logWarn(`MongoDB write failed, persisting to PostgreSQL backup: ${error.message}`);
    }
  }

  if (postgresPool) {
    await writeToPostgresBackup(safeStore);
    activeStorage = 'postgres-backup';
    cachedStore = safeStore;     cachedStoreAt = Date.now();
    cachedStoreFull = safeStore; cachedStoreFullAt = Date.now();
    return;
  }

  throw new Error('No storage provider available');
}

async function getAdminByUsername(username) {
  if (postgresPool) {
    const res = await postgresPool.query('SELECT * FROM admins WHERE username = $1 LIMIT 1', [username]);
    if (res.rows.length > 0) return res.rows[0];
  }
  if (mongoCollection) {
    const db = mongoClient.db(MONGODB_DB_NAME);
    const admin = await db.collection('admins').findOne({ username });
    if (admin) return admin;
  }
  return null;
}

async function logAudit(action, username, details = {}) {
  try {
    if (postgresPool) {
      await postgresPool.query(
        'INSERT INTO audit_logs (action, username, details) VALUES ($1, $2, $3)',
        [action, username, JSON.stringify(details)]
      );
      // Prune logs exceeding 50 entries
      await postgresPool.query(
        'DELETE FROM audit_logs WHERE id NOT IN (SELECT id FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 50)'
      );
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('audit_logs').insertOne({
        action,
        username,
        details,
        created_at: new Date()
      });
      // Prune logs exceeding 50 entries
      const excessAuditDocs = await db.collection('audit_logs').find().sort({ created_at: -1, _id: -1 }).skip(50).toArray();
      if (excessAuditDocs.length > 0) {
        const idsToDelete = excessAuditDocs.map(d => d._id);
        await db.collection('audit_logs').deleteMany({ _id: { $in: idsToDelete } });
      }
    }
  } catch (err) {
    logError(`Failed to save audit log: ${err.message}`);
  }
}

async function logErrorToDb(errorData) {
  const {
    errorMessage = 'Unknown error',
    errorStack = null,
    errorCode = null,
    endpoint = null,
    method = null,
    statusCode = null,
    username = 'anonymous',
    userRole = null,
    requestPayload = null,
    responseData = null,
    clientInfo = null,
    userNotes = null,
    isResolved = false,
  } = errorData;

  try {
    let savedId = null;
    if (postgresPool) {
      const res = await postgresPool.query(
        `INSERT INTO error_logs 
         (error_message, error_stack, error_code, endpoint, method, status_code, username, user_role, request_payload, response_data, client_info, user_notes, is_resolved)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13)
         RETURNING id`,
        [
          String(errorMessage).slice(0, 1000),
          errorStack ? String(errorStack).slice(0, 5000) : null,
          errorCode ? String(errorCode).slice(0, 100) : null,
          endpoint ? String(endpoint).slice(0, 255) : null,
          method ? String(method).slice(0, 20) : null,
          typeof statusCode === 'number' ? statusCode : null,
          String(username || 'anonymous').slice(0, 100),
          userRole ? String(userRole).slice(0, 50) : null,
          requestPayload ? JSON.stringify(requestPayload) : null,
          responseData ? JSON.stringify(responseData) : null,
          clientInfo ? JSON.stringify(clientInfo) : null,
          userNotes ? String(userNotes).slice(0, 2000) : null,
          Boolean(isResolved)
        ]
      );
      savedId = res.rows[0]?.id;
      // Prune error logs exceeding 50 entries
      await postgresPool.query(
        'DELETE FROM error_logs WHERE id NOT IN (SELECT id FROM error_logs ORDER BY created_at DESC, id DESC LIMIT 50)'
      );
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      const res = await db.collection('error_logs').insertOne({
        error_message: String(errorMessage).slice(0, 1000),
        error_stack: errorStack ? String(errorStack).slice(0, 5000) : null,
        error_code: errorCode ? String(errorCode).slice(0, 100) : null,
        endpoint: endpoint ? String(endpoint).slice(0, 255) : null,
        method: method ? String(method).slice(0, 20) : null,
        status_code: typeof statusCode === 'number' ? statusCode : null,
        username: String(username || 'anonymous').slice(0, 100),
        user_role: userRole ? String(userRole).slice(0, 50) : null,
        request_payload: requestPayload,
        response_data: responseData,
        client_info: clientInfo,
        user_notes: userNotes ? String(userNotes).slice(0, 2000) : null,
        is_resolved: Boolean(isResolved),
        created_at: new Date()
      });
      if (!savedId) savedId = res.insertedId;
      // Prune error logs exceeding 50 entries
      const excessErrorDocs = await db.collection('error_logs').find().sort({ created_at: -1, _id: -1 }).skip(50).toArray();
      if (excessErrorDocs.length > 0) {
        const idsToDelete = excessErrorDocs.map(d => d._id);
        await db.collection('error_logs').deleteMany({ _id: { $in: idsToDelete } });
      }
    }
    return savedId;
  } catch (err) {
    logError(`Failed to save error log to DB: ${err.message}`);
    return null;
  }
}

async function seedDefaultSuperAdmin() {
  // Credentials come from environment variables ONLY — never hardcode them.
  // Without SUPERADMIN_PASSWORD we do NOT create an account (prevents seeding
  // an account with a publicly-known password from the source code).
  const superAdminUsername = process.env.SUPERADMIN_USERNAME || 'sohail';
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || '';

  if (!superAdminPassword) {
    logWarn('SUPERADMIN_PASSWORD is not set — skipping superadmin seeding. Set it in environment variables to create/reset the superadmin.');
    return;
  }

  try {
    const existing = await getAdminByUsername(superAdminUsername);
    const superAdminPassHash = await hashPassword(superAdminPassword);
    const adminData = {
      username: superAdminUsername,
      password_hash: superAdminPassHash,
      role: 'SUPERADMIN',
      permissions: ['VISUAL_EDITOR', 'ACCOUNT_PASSWORD_RESET', 'VIEW_LOGS', 'VIEW_ERROR_LOGS', 'DEACTIVATE_ACCOUNT', 'DELETE_ACCOUNT', 'ADMIN_CREATOR', 'EVENT_MANAGER'],
      is_temporary_password: false,
      is_active: true,
      passkeys: []
    };
      
    if (postgresPool) {
      await postgresPool.query(
        `INSERT INTO admins (username, password_hash, role, permissions, is_temporary_password, is_active, passkeys) 
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb) 
         ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, permissions = EXCLUDED.permissions`,
        [adminData.username, adminData.password_hash, adminData.role, JSON.stringify(adminData.permissions), adminData.is_temporary_password, adminData.is_active, JSON.stringify(adminData.passkeys)]
      );
    }
      if (mongoCollection) {
        const db = mongoClient.db(MONGODB_DB_NAME);
        const { permissions, ...insertData } = adminData;
        await db.collection('admins').updateOne(
          { username: superAdminUsername },
          { $set: { permissions: adminData.permissions, password_hash: adminData.password_hash } },
          { $setOnInsert: insertData },
          { upsert: true }
        );
      }
      logInfo('Default superadmin seeded/updated successfully.');
      if (!existing) {
        await logAudit('CREATE_ADMIN', 'SYSTEM', { newAdmin: superAdminUsername });
      }
  } catch (err) {
    logError(`Failed to seed superadmin: ${err.message}`);
  }
}

async function initStorage() {
  await connectPostgresBackup();
  await connectMongo();

  if (!mongoCollection && !postgresPool) {
    throw new Error('Neither MongoDB nor PostgreSQL backup is configured/available');
  }

  // ── Startup Integrity Check ───────────────────────────────────────────────
  if (ENABLE_STARTUP_INTEGRITY_CHECK && mongoCollection && postgresPool) {
    logIntegrity('Comparing MongoDB ↔ PostgreSQL data...');
    try {
      const mongoDoc = await mongoCollection.findOne({ _id: DOC_ID });
      const pgStore  = await readFromPostgresBackup();

      if (!mongoDoc && !pgStore) {
        logIntegrity('Both databases are empty. Fresh start.');

      } else if (!mongoDoc && pgStore) {
        logIntegrity('MongoDB has no data. Seeding from PostgreSQL...');
        await restoreMongoFromPostgres(pgStore);
        logIntegrity('✅ MongoDB seeded from PostgreSQL. Starting server.');

      } else if (mongoDoc && !pgStore) {
        logIntegrity('PostgreSQL has no data. Seeding from MongoDB...');
        await writeToPostgresBackup(normalizeStore(mongoDoc));
        logIntegrity('✅ PostgreSQL seeded from MongoDB. Starting server.');

      } else {
        const mongoStore = normalizeStore(mongoDoc);
        const { identical, mongoTimestamp, pgTimestamp } = compareStores(mongoStore, pgStore);

        if (identical) {
          logIntegrity('✅ Databases are in sync. Starting server.');
        } else {
          logIntegrity('⚠️  Data mismatch detected!');
          logIntegrity(`  MongoDB    last saved: ${mongoTimestamp}`);
          logIntegrity(`  PostgreSQL last saved: ${pgTimestamp}`);
          logIntegrity('MongoDB wins. Restoring PostgreSQL from MongoDB...');
          await writeToPostgresBackup(mongoStore);
          logIntegrity('✅ PostgreSQL restored from MongoDB. Starting server.');
        }
      }

      activeStorage = 'mongodb+postgres';
    } catch (error) {
      logWarn(`Integrity check failed: ${error.message}. Continuing with available storage.`);
      activeStorage = mongoCollection ? 'mongodb' : 'postgres-backup';
    }

  } else if (mongoCollection && postgresPool) {
    activeStorage = 'mongodb+postgres';
    logWarn('Startup integrity check skipped for faster production boot.');

  } else if (mongoCollection) {
    activeStorage = 'mongodb';
    logWarn('PostgreSQL backup not available. Running in MongoDB-only mode.');

  } else {
    activeStorage = 'postgres-backup';
    logWarn('MongoDB unavailable. Running in PostgreSQL-only mode.');
    if (STRICT_DUAL_WRITE) {
      logWarn('STRICT_DUAL_WRITE is active but only PostgreSQL is available.');
      logWarn('Writes will go to PostgreSQL only until MongoDB recovers.');
    }
  }

  // Pre-load the cache so the first request is also instantaneous
  try {
    await readStore();
    logIntegrity('✅ Memory cache pre-loaded.');
  } catch (err) {
    logWarn(`Failed to pre-load memory cache: ${err.message}`);
  }
  
  await seedDefaultSuperAdmin();
  await processScheduledDeletions();
  setInterval(processScheduledDeletions, 60 * 1000);
}

async function processScheduledDeletions() {
  try {
    const now = new Date();
    if (postgresPool) {
      const expiredRes = await postgresPool.query(
        'SELECT username FROM admins WHERE scheduled_for_deletion_at IS NOT NULL AND scheduled_for_deletion_at <= $1',
        [now]
      );
      for (const row of expiredRes.rows) {
        if (row.username !== 'sohail') {
          await postgresPool.query('DELETE FROM admins WHERE username = $1', [row.username]);
          await logAudit('PERMANENT_DELETE_ADMIN', 'SYSTEM', { targetAdmin: row.username });
        }
      }
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      const expiredDocs = await db.collection('admins').find({
        scheduled_for_deletion_at: { $ne: null, $lte: now }
      }).toArray();
      for (const doc of expiredDocs) {
        if (doc.username !== 'sohail') {
          await db.collection('admins').deleteOne({ _id: doc._id });
          await logAudit('PERMANENT_DELETE_ADMIN', 'SYSTEM', { targetAdmin: doc.username });
        }
      }
    }
  } catch (err) {
    logError(`Error processing scheduled deletions: ${err.message}`);
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// ── Password hashing (bcrypt) with SHA-256 migration ─────────────────────────
// New and reset passwords are stored as bcrypt hashes. Legacy SHA-256 hashes
// (pre-migration) are verified then transparently upgraded to bcrypt on the
// next successful login.
const BCRYPT_ROUNDS = 10;

async function hashPassword(password) {
  return bcrypt.hash(String(password), BCRYPT_ROUNDS);
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(String(password), storedHash);
  }

  // Legacy unsalted SHA-256 hash — verify via constant-time compare.
  const isSha256 = /^[a-f0-9]{64}$/i.test(storedHash);
  if (isSha256 && safeEqualHex(sha256(String(password)), storedHash)) {
    return true;
  }
  return false;
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

function getTokenFromRequest(req) {
  return getAuthToken(req);
}

async function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await getAdminByUsername(decoded.username);
    if (!admin || admin.is_active === false || admin.scheduled_for_deletion_at) {
      clearAuthCookie(res);
      return res.status(401).json({ message: 'Account deactivated or scheduled for deletion' });
    }
    req.user = {
      ...decoded,
      permissions: admin.permissions || decoded.permissions || [],
      role: admin.role || decoded.role,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    storage: activeStorage,
    mongoConfigured: Boolean(MONGODB_URI),
    mongoConnected: Boolean(mongoCollection),
    postgresConfigured: Boolean(POSTGRES_BACKUP_URL),
    postgresConnected: Boolean(postgresPool),
  });
});

// Helpers to serve cacheable public JSON.
// Browsers revalidate every time via ETag (cheap 304) so the admin always sees
// fresh content after a save; shared/CDN caches (e.g. Cloudflare free edge)
// hold the payload for `edgeMaxAge` seconds via s-maxage, so public visitors
// are served from the nearest edge (fast) yet see admin updates quickly.
// NOTE: stale-while-revalidate is deliberately NOT used here — it lets an edge
// serve an old body for a second full window after a save, which is exactly
// what caused the "featured event still shows the old one" bug.
function etagOf(value) {
  return `"${crypto.createHash('sha256').update(value).digest('hex').slice(0, 32)}"`;
}

function sendPublicJson(req, res, data, { edgeMaxAge = 60 } = {}) {
  const body = JSON.stringify(data);
  const etag = etagOf(body);
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', `public, s-maxage=${edgeMaxAge}, max-age=0, must-revalidate`);
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }
  res.json(data);
}

// Public content — cached at the edge (Cloudflare/Vercel), revalidated by ETag.
app.get('/api/content', async (req, res) => {
  try {
    const store = await readStore();
    sendPublicJson(req, res, { websiteData: store.websiteData });
  } catch {
    res.status(500).json({ message: 'Failed to load content' });
  }
});

// ── Login brute-force protection ──────────────────────────────────────────────
// Simple in-memory sliding-window limiter per (IP + username). 5 failed attempts
// within 15 minutes locks the pair out for 15 minutes. Successful login clears it.
const LOGIN_MAX_FAILURES = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

function getLoginKey(req, username) {
  return `${req.ip || req.socket?.remoteAddress || 'unknown'}|${username}`;
}

function tooManyLoginAttempts(req, username) {
  const key = getLoginKey(req, username);
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (now - entry.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.failures >= LOGIN_MAX_FAILURES;
}

function recordLoginFailure(req, username) {
  const key = getLoginKey(req, username);
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { windowStart: now, failures: 1 });
  } else {
    entry.failures += 1;
  }
}

function clearLoginFailures(req, username) {
  loginAttempts.delete(getLoginKey(req, username));
}

app.post('/api/admin/login', async (req, res) => {
  const { username = '', password = '' } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid credentials payload' });
  }

  const trimmedUsername = username.trim();
  if (tooManyLoginAttempts(req, trimmedUsername)) {
    return res.status(429).json({ message: 'Too many failed login attempts. Try again in 15 minutes.' });
  }

  const admin = await getAdminByUsername(trimmedUsername);
  if (!admin) {
    recordLoginFailure(req, trimmedUsername);
    return res.status(401).json({ message: 'Incorrect credentials. Please try again.' });
  }
  
  if (!admin.is_active) {
    return res.status(403).json({ message: 'Account is deactivated.' });
  }

  const passwordOk = await verifyPassword(password, admin.password_hash);
  if (!passwordOk) {
    recordLoginFailure(req, trimmedUsername);
    return res.status(401).json({ message: 'Incorrect credentials. Please try again.' });
  }

  clearLoginFailures(req, trimmedUsername);

  // Legacy SHA-256 hash? Upgrade to bcrypt now that the password is verified.
  if (!String(admin.password_hash).startsWith('$2')) {
    try {
      const upgradedHash = await hashPassword(String(password));
      if (postgresPool) {
        await postgresPool.query(
          'UPDATE admins SET password_hash = $1 WHERE username = $2',
          [upgradedHash, admin.username]
        );
      }
      if (mongoCollection) {
        const db = mongoClient.db(MONGODB_DB_NAME);
        await db.collection('admins').updateOne(
          { username: admin.username },
          { $set: { password_hash: upgradedHash } }
        );
      }
      logInfo(`Upgraded ${admin.username} to bcrypt password hash`);
    } catch (upgradeErr) {
      logWarn(`Password upgrade failed for ${admin.username} (non-fatal): ${upgradeErr.message}`);
    }
  }

  if (admin.is_temporary_password) {
    const tempToken = jwt.sign(
      { username: admin.username, role: admin.role, requirePasswordChange: true },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    return res.json({ requirePasswordChange: true, tempToken });
  }

  const token = jwt.sign(
    { username: admin.username, role: admin.role, permissions: admin.permissions },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );

  setAuthCookie(res, token);
  await logAudit('LOGIN', admin.username);

  return res.json({ authenticated: true, permissions: admin.permissions });
});

app.post('/api/admin/logout', (_req, res) => {
  clearAuthCookie(res);
  return res.json({ message: 'Logged out' });
});

app.get('/api/admin/session', requireAuth, (_req, res) => {
  res.json({ authenticated: true, permissions: _req.user.permissions, username: _req.user.username, role: _req.user.role });
});

app.get('/api/admin/content', requireAuth, async (_req, res) => {
  try {
    const store = await readStore(true);
    res.json({ websiteData: store.websiteData, history: store.history });
  } catch {
    res.status(500).json({ message: 'Failed to load admin content' });
  }
});

app.put('/api/admin/content', requireAuth, async (req, res) => {
  try {
    const payloadError = validateWebsitePayload(req.body || {});
    if (payloadError) {
      return res.status(400).json({ message: payloadError });
    }

    const incoming = normalizeWebsiteData(req.body || {});
    const store = await readStore(true);

    const oldData = normalizeWebsiteData(store.websiteData);
    const newData = normalizeWebsiteData({
      ...incoming,
      timestamp: new Date().toLocaleString(),
    });

    const historyEntry = { old: oldData, new: newData, changedBy: req.user?.username || 'unknown' };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: newData, history: nextHistory });
    await logAudit('UPDATE_CONTENT', req.user?.username || 'unknown');

    res.json({
      websiteData: newData,
      history: nextHistory,
      message: 'Updated Successfully!',
    });
  } catch {
    res.status(500).json({ message: 'Failed to update content' });
  }
});

app.post('/api/admin/restore', requireAuth, async (req, res) => {
  try {
    const restoredSource = req.body?.data;
    if (!restoredSource || typeof restoredSource !== 'object') {
      return res.status(400).json({ message: 'Invalid restore payload' });
    }

    const store = await readStore(true);
    const oldData = normalizeWebsiteData(store.websiteData);
    const payloadError = validateWebsitePayload(restoredSource);
    if (payloadError) {
      return res.status(400).json({ message: payloadError });
    }

    const restored = normalizeWebsiteData({
      ...restoredSource,
      timestamp: new Date().toLocaleString(),
    });

    const historyEntry = { old: oldData, new: restored };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: restored, history: nextHistory });

    return res.json({ message: 'Restored to specific version successfully!', websiteData: restored, history: nextHistory });
  } catch {
    res.status(500).json({ message: 'Failed to restore content' });
  }
});

app.post('/api/admin/restore-defaults', requireAuth, async (req, res) => {
  try {
    const store = await readStore(true);
    const oldData = normalizeWebsiteData(store.websiteData);

    const restored = {
      ...websiteDefaults,
      timestamp: new Date().toLocaleString(),
    };

    const historyEntry = { old: oldData, new: restored };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: restored, history: nextHistory });

    return res.json({ message: 'Restored to defaults successfully!', websiteData: restored, history: nextHistory });
  } catch (err) {
    logError(`restore-defaults error: ${err.message}`);
    res.status(500).json({ message: 'Failed to restore defaults' });
  }
});

// ── Admin Management Routes ───────────────────────────────────────────────────

function generateRandomPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  // Ensure complexity
  pass += 'aA1!'; 
  return pass;
}

function validatePasswordComplexity(password) {
  if (typeof password !== 'string' || password.length < 8) return false;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  return hasLower && hasUpper && hasDigit && hasSpecial;
}

app.get('/api/admin/users', requireAuth, async (req, res) => {
  const allowed = req.user.role === 'SUPERADMIN' ||
    ['ADMIN_CREATOR', 'DELETE_ACCOUNT', 'DEACTIVATE_ACCOUNT', 'ACCOUNT_PASSWORD_RESET'].some(p => req.user.permissions?.includes(p));
  if (!allowed) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    await processScheduledDeletions();
    let admins = [];
    if (postgresPool) {
      const result = await postgresPool.query('SELECT username, email, role, permissions, is_active, is_temporary_password, scheduled_for_deletion_at FROM admins');
      admins = result.rows;
    } else if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      admins = await db.collection('admins').find({}, { projection: { password_hash: 0, reset_code: 0, current_challenge: 0 } }).toArray();
    }
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
});

app.post('/api/admin/users', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('ADMIN_CREATOR') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const { username, email = '', permissions = [] } = req.body;
  if (!username) return res.status(400).json({ message: 'Username required' });
  if (!email || !email.trim()) return res.status(400).json({ message: 'Email address is required' });
  
  const tempPassword = generateRandomPassword();
  const passHash = await hashPassword(tempPassword);
  const cleanEmail = email.trim();
  
  try {
    const existing = await getAdminByUsername(username);
    if (existing) return res.status(400).json({ message: 'Username already exists' });
    
    if (postgresPool) {
      await postgresPool.query(
        'INSERT INTO admins (username, email, password_hash, role, permissions, is_temporary_password) VALUES ($1, $2, $3, $4, $5::jsonb, $6)',
        [username, cleanEmail, passHash, 'ADMIN', JSON.stringify(permissions), true]
      );
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('admins').insertOne({
        username, email: cleanEmail, password_hash: passHash, role: 'ADMIN', permissions, is_temporary_password: true, is_active: true, passkeys: []
      });
    }
    
    await logAudit('CREATE_ADMIN', req.user.username, { newAdmin: username, email: cleanEmail, permissions });
    res.json({ message: 'Admin created', username, email: cleanEmail, tempPassword });
  } catch (err) {
    console.error('Create Admin Error:', err);
    res.status(500).json({ message: 'Failed to create admin' });
  }
});

app.post('/api/admin/users/send-credentials', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('ADMIN_CREATOR') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { username, email, tempPassword } = req.body;
  if (!email || !username || !tempPassword) {
    return res.status(400).json({ message: 'Missing required credentials parameters' });
  }

  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (!smtpUser || !smtpPass) {
    return res.status(500).json({
      message: 'SMTP Email configuration is missing on the server. Please configure SMTP_USER and SMTP_PASS (Google App Password) in environment variables.'
    });
  }

  try {
    const transporter = createMailTransport();
    if (!transporter) {
      return res.status(500).json({
        message: 'SMTP Email configuration is missing on the server. Please configure SMTP_USER and SMTP_PASS (Google App Password) in environment variables.'
      });
    }

    const mailOptions = {
      from: `"Rotaract Club of Swoyambhu" <${smtpUser}>`,
      to: email,
      subject: 'Welcome to Rotaract Club of Swoyambhu Admin C-Panel',
      html: emailShell({
        title: 'Welcome to the Control Panel',
        kicker: 'Admin Account Created',
        children: `
          <p style="margin:0 0 14px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#3a231a;">Hello <strong>${escapeHtml(username)}</strong>,</p>
          <p style="margin:0 0 20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#4b3a30;">An administrative account has been created for you at <strong>Rotaract Club of Swoyambhu Control Panel</strong>. Use the credentials below to sign in:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf9f1; border:1px solid #efe3cb; border-radius:14px; padding:6px 18px;">
            ${emailDetailRow('👤', 'Username', username)}
            ${emailDetailRow('🔑', 'Temporary Password', tempPassword)}
          </table>
          <p style="margin:20px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#B91C1C; font-weight:600;">⚠️ For security reasons, you will be required to change this temporary password upon your first sign-in.</p>
        `,
        footerNote: 'Regards,<br/>Rotaract Club of Swoyambhu Executive Team',
      }),
    };

    await transporter.sendMail(mailOptions);
    await logAudit('SEND_ADMIN_CREDENTIALS_EMAIL', req.user.username, { recipient: email, targetAdmin: username });
    res.json({ success: true, message: `Credentials successfully sent to ${email}` });
  } catch (err) {
    console.error('Send Credentials Email Error:', err);
    res.status(500).json({ message: `Failed to send email: ${err.message}` });
  }
});

app.put('/api/admin/users/:username/permissions', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('ADMIN_CREATOR') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires ADMIN_CREATOR or SUPERADMIN' });
  }
  const { username } = req.params;
  const { permissions = [] } = req.body;

  const targetAdmin = await getAdminByUsername(username);
  if (!targetAdmin) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (targetAdmin.role === 'SUPERADMIN') {
    return res.status(400).json({ message: 'Cannot modify permissions of SUPERADMIN' });
  }

  try {
    if (postgresPool) {
      await postgresPool.query('UPDATE admins SET permissions = $1::jsonb WHERE username = $2', [JSON.stringify(permissions), username]);
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('admins').updateOne({ username }, { $set: { permissions } });
    }
    await logAudit('UPDATE_ADMIN_PERMISSIONS', req.user.username, { targetAdmin: username, permissions });
    res.json({ message: 'Permissions updated successfully', permissions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update permissions' });
  }
});

app.put('/api/admin/users/:username/status', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('DEACTIVATE_ACCOUNT') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { username } = req.params;
  const { is_active } = req.body;
  
  try {
    if (postgresPool) {
      await postgresPool.query('UPDATE admins SET is_active = $1 WHERE username = $2', [is_active, username]);
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('admins').updateOne({ username }, { $set: { is_active } });
    }
    await logAudit('TOGGLE_ACTIVE', req.user.username, { targetAdmin: username, is_active });
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

app.delete('/api/admin/users/:username', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('DELETE_ACCOUNT') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { username } = req.params;
  if (username === req.user.username) {
    return res.status(400).json({ message: 'Cannot delete yourself' });
  }
  if (username === 'sohail') {
    return res.status(400).json({ message: 'Cannot delete default superadmin' });
  }
  
  const deletionTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  try {
    if (postgresPool) {
      await postgresPool.query(
        'UPDATE admins SET scheduled_for_deletion_at = $1, is_active = false WHERE username = $2',
        [deletionTime, username]
      );
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('admins').updateOne(
        { username },
        { $set: { scheduled_for_deletion_at: deletionTime, is_active: false } }
      );
    }
    await logAudit('SCHEDULE_DELETE_ADMIN', req.user.username, { targetAdmin: username, scheduled_for_deletion_at: deletionTime });
    res.json({ message: 'Admin account scheduled for deletion in 24 hours. The account has been deactivated.', scheduled_for_deletion_at: deletionTime });
  } catch (err) {
    res.status(500).json({ message: 'Failed to schedule admin deletion' });
  }
});

app.post('/api/admin/users/:username/cancel-deletion', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('DELETE_ACCOUNT') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { username } = req.params;
  try {
    if (postgresPool) {
      await postgresPool.query(
        'UPDATE admins SET scheduled_for_deletion_at = NULL, is_active = true WHERE username = $1',
        [username]
      );
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('admins').updateOne(
        { username },
        { $set: { scheduled_for_deletion_at: null, is_active: true } }
      );
    }
    await logAudit('CANCEL_DELETE_ADMIN', req.user.username, { targetAdmin: username });
    res.json({ message: 'Account deletion cancelled successfully and account reactivated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel admin deletion' });
  }
});

app.post('/api/admin/change-password', async (req, res) => {
  // Can be called with tempToken or normal token
  let token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const { currentPassword, newPassword } = req.body;
  if (!validatePasswordComplexity(newPassword)) {
    return res.status(400).json({ message: 'Password must have 1 upper, 1 lower, 1 number, 1 special char.' });
  }
  
  const admin = await getAdminByUsername(user.username);
  if (!admin || !admin.is_active) return res.status(403).json({ message: 'Account deactivated or invalid' });
  
  if (!(await verifyPassword(currentPassword, admin.password_hash))) {
    return res.status(401).json({ message: 'Incorrect current password' });
  }
  
  const newHash = await hashPassword(newPassword);
  
  try {
    if (postgresPool) {
      await postgresPool.query('UPDATE admins SET password_hash = $1, is_temporary_password = false WHERE username = $2', [newHash, user.username]);
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('admins').updateOne({ username: user.username }, { $set: { password_hash: newHash, is_temporary_password: false } });
    }
    await logAudit('CHANGE_PASSWORD', user.username);
    res.json({ message: 'Password updated successfully. Please login again.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update password' });
  }
});

app.post('/api/admin/generate-reset-code', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('ACCOUNT_PASSWORD_RESET') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const { username } = req.body;
  const resetCode = crypto.randomBytes(8).toString('hex'); // 16 chars
  
  try {
    if (postgresPool) {
      await postgresPool.query('UPDATE admins SET reset_code = $1 WHERE username = $2', [resetCode, username]);
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('admins').updateOne({ username }, { $set: { reset_code: resetCode } });
    }
    await logAudit('GENERATE_RESET_CODE', req.user.username, { targetAdmin: username });
    res.json({ message: 'Code generated', resetCode });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate code' });
  }
});

app.post('/api/admin/forgot-password', async (req, res) => {
  const { username, resetCode, newPassword } = req.body;
  if (!validatePasswordComplexity(newPassword)) {
    return res.status(400).json({ message: 'Password must have 1 upper, 1 lower, 1 number, 1 special char.' });
  }
  
  const admin = await getAdminByUsername(username);
  if (!admin || admin.reset_code !== resetCode || !admin.is_active) {
    return res.status(400).json({ message: 'Invalid reset code or username' });
  }
  
  const newHash = await hashPassword(newPassword);
  
  try {
    if (postgresPool) {
      await postgresPool.query('UPDATE admins SET password_hash = $1, reset_code = NULL, is_temporary_password = false WHERE username = $2', [newHash, username]);
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('admins').updateOne({ username }, { $set: { password_hash: newHash, reset_code: null, is_temporary_password: false } });
    }
    await logAudit('USED_RESET_CODE', username);
    res.json({ message: 'Password has been reset' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

app.get('/api/admin/logs', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('VIEW_LOGS') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(15, Math.max(1, Number.parseInt(req.query.limit, 10) || 15));
    const offset = (page - 1) * pageSize;

    let logs = [];
    let totalCount = 0;

    if (postgresPool) {
      const countResult = await postgresPool.query('SELECT COUNT(*)::int AS count FROM audit_logs');
      totalCount = countResult.rows[0]?.count || 0;

      const result = await postgresPool.query(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset]
      );
      logs = result.rows;
    } else if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      totalCount = await db.collection('audit_logs').countDocuments();
      logs = await db.collection('audit_logs').find().sort({ created_at: -1 }).skip(offset).limit(pageSize).toArray();
    }

    res.json({
      logs,
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

// ── Error Reports & Error Logs APIs ──────────────────────────────────────────

// Public & Admin bug reporting endpoint
app.post('/api/error-report', async (req, res) => {
  try {
    let authUser = null;
    const token = getAuthToken(req);
    if (token) {
      try {
        authUser = jwt.verify(token, JWT_SECRET);
      } catch {
        // Ignored if invalid token
      }
    }

    const {
      errorMessage,
      errorStack,
      errorCode,
      endpoint,
      method,
      statusCode,
      requestPayload,
      responseData,
      clientInfo,
      userNotes,
    } = req.body || {};

    if (!errorMessage && !endpoint) {
      return res.status(400).json({ message: 'Error message or endpoint is required' });
    }

    const reportId = await logErrorToDb({
      errorMessage: errorMessage || 'Client reported error',
      errorStack,
      errorCode,
      endpoint,
      method,
      statusCode: Number.isInteger(statusCode) ? statusCode : 500,
      username: authUser?.username || req.body?.username || 'anonymous',
      userRole: authUser?.role || req.body?.userRole || null,
      requestPayload,
      responseData,
      clientInfo: {
        ...(clientInfo || {}),
        ip: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || clientInfo?.userAgent || null,
      },
      userNotes,
      isResolved: false,
    });

    if (authUser) {
      await logAudit('REPORT_BUG', authUser.username, { reportId, endpoint, errorCode });
    }

    res.json({
      success: true,
      reportId,
      message: 'Bug report submitted successfully to Error Logs.',
    });
  } catch (err) {
    logError(`Error reporting failed: ${err.message}`);
    res.status(500).json({ message: 'Failed to process bug report' });
  }
});

// Get paginated and filtered error logs (Requires VIEW_ERROR_LOGS or SUPERADMIN)
app.get('/api/admin/error-logs', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('VIEW_ERROR_LOGS') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires VIEW_ERROR_LOGS permission' });
  }

  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 15));
    const offset = (page - 1) * pageSize;
    const statusFilter = req.query.status || 'all'; // 'all', 'unresolved', 'resolved'
    const search = (req.query.search || '').trim().toLowerCase();

    let logs = [];
    let totalCount = 0;
    let unresolvedCount = 0;
    let resolvedCount = 0;

    if (postgresPool) {
      // Global counts for stat cards
      const totalRes = await postgresPool.query('SELECT COUNT(*)::int AS count FROM error_logs');
      const unresRes = await postgresPool.query('SELECT COUNT(*)::int AS count FROM error_logs WHERE is_resolved = false');
      totalCount = totalRes.rows[0]?.count || 0;
      unresolvedCount = unresRes.rows[0]?.count || 0;
      resolvedCount = totalCount - unresolvedCount;

      // Filtered query
      const whereClauses = [];
      const params = [];
      let pIdx = 1;

      if (statusFilter === 'unresolved') {
        whereClauses.push(`is_resolved = false`);
      } else if (statusFilter === 'resolved') {
        whereClauses.push(`is_resolved = true`);
      }

      if (search) {
        whereClauses.push(`(
          LOWER(error_message) LIKE $${pIdx} OR 
          LOWER(COALESCE(endpoint, '')) LIKE $${pIdx} OR 
          LOWER(COALESCE(username, '')) LIKE $${pIdx} OR 
          LOWER(COALESCE(error_code, '')) LIKE $${pIdx}
        )`);
        params.push(`%${search}%`);
        pIdx++;
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      
      const filteredCountRes = await postgresPool.query(`SELECT COUNT(*)::int AS count FROM error_logs ${whereSql}`, params);
      const filteredCount = filteredCountRes.rows[0]?.count || 0;

      const queryParams = [...params, pageSize, offset];
      const listRes = await postgresPool.query(
        `SELECT * FROM error_logs ${whereSql} ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
        queryParams
      );
      logs = listRes.rows;

      res.json({
        logs,
        page,
        pageSize,
        totalCount: filteredCount,
        globalTotal: totalCount,
        unresolvedCount,
        resolvedCount,
        totalPages: Math.max(1, Math.ceil(filteredCount / pageSize)),
      });
      return;
    }

    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      const collection = db.collection('error_logs');

      totalCount = await collection.countDocuments();
      unresolvedCount = await collection.countDocuments({ is_resolved: false });
      resolvedCount = totalCount - unresolvedCount;

      const filter = {};
      if (statusFilter === 'unresolved') filter.is_resolved = false;
      if (statusFilter === 'resolved') filter.is_resolved = true;
      if (search) {
        filter.$or = [
          { error_message: { $regex: search, $options: 'i' } },
          { endpoint: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { error_code: { $regex: search, $options: 'i' } },
        ];
      }

      const filteredCount = await collection.countDocuments(filter);
      logs = await collection.find(filter).sort({ created_at: -1 }).skip(offset).limit(pageSize).toArray();

      res.json({
        logs,
        page,
        pageSize,
        totalCount: filteredCount,
        globalTotal: totalCount,
        unresolvedCount,
        resolvedCount,
        totalPages: Math.max(1, Math.ceil(filteredCount / pageSize)),
      });
      return;
    }

    res.status(500).json({ message: 'No database storage available' });
  } catch (err) {
    logError(`Fetch error logs failed: ${err.message}`);
    res.status(500).json({ message: 'Failed to fetch error logs' });
  }
});

// Toggle resolve state of an error log
app.put('/api/admin/error-logs/:id/resolve', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('VIEW_ERROR_LOGS') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires VIEW_ERROR_LOGS permission' });
  }

  const { id } = req.params;
  const { is_resolved } = req.body;
  const newStatus = typeof is_resolved === 'boolean' ? is_resolved : true;

  try {
    if (postgresPool) {
      const numId = Number(id);
      if (Number.isInteger(numId)) {
        await postgresPool.query('UPDATE error_logs SET is_resolved = $1 WHERE id = $2', [newStatus, numId]).catch(() => {});
      }
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('error_logs').updateOne(query, { $set: { is_resolved: newStatus } }).catch(() => {});
    }

    await logAudit('RESOLVE_ERROR_LOG', req.user.username, { errorLogId: id, is_resolved: newStatus });
    res.json({ message: `Error log marked as ${newStatus ? 'resolved' : 'unresolved'}`, is_resolved: newStatus });
  } catch (err) {
    logError(`Resolve error log failed: ${err.message}`);
    res.status(500).json({ message: 'Failed to update error log status' });
  }
});

// Delete a single error log
app.delete('/api/admin/error-logs/:id', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('VIEW_ERROR_LOGS') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires VIEW_ERROR_LOGS permission' });
  }

  const { id } = req.params;
  try {
    if (postgresPool) {
      const numId = Number(id);
      if (Number.isInteger(numId)) {
        await postgresPool.query('DELETE FROM error_logs WHERE id = $1', [numId]).catch(() => {});
      }
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('error_logs').deleteOne(query).catch(() => {});
    }

    await logAudit('DELETE_ERROR_LOG', req.user.username, { errorLogId: id });
    res.json({ message: 'Error log deleted' });
  } catch (err) {
    logError(`Delete error log failed: ${err.message}`);
    res.status(500).json({ message: 'Failed to delete error log' });
  }
});

// Clear all error logs
app.delete('/api/admin/error-logs', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('VIEW_ERROR_LOGS') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires VIEW_ERROR_LOGS permission' });
  }

  try {
    if (postgresPool) {
      await postgresPool.query('DELETE FROM error_logs');
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('error_logs').deleteMany({});
    }

    await logAudit('CLEAR_ALL_ERROR_LOGS', req.user.username);
    res.json({ message: 'All error logs have been cleared' });
  } catch (err) {
    logError(`Clear error logs failed: ${err.message}`);
    res.status(500).json({ message: 'Failed to clear error logs' });
  }
});

// ── Event Management APIs ───────────────────────────────────────────────────

app.get('/api/events', async (req, res) => {
  try {
    const store = await readStore();
    const allEvents = Array.isArray(store.websiteData?.eventsList) ? store.websiteData.eventsList : [];
    // Public only gets published events
    const published = sanitizeEventsList(allEvents.filter(e => e.status !== 'Draft'));
    // No edge caching for events — admin edits must propagate immediately.
    sendPublicJson(req, res, published, { edgeMaxAge: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

app.get('/api/admin/events', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('EVENT_MANAGER') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires EVENT_MANAGER or SUPERADMIN' });
  }
  try {
    const store = await readStore();
    const allEvents = Array.isArray(store.websiteData?.eventsList) ? store.websiteData.eventsList : [];
    res.json(sanitizeEventsList(allEvents));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin events' });
  }
});

app.post('/api/admin/events', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('EVENT_MANAGER') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires EVENT_MANAGER or SUPERADMIN' });
  }

  const { title, description = '', tags = [], pictures = [], eventDate, eventTime = '', attendees = '', registrationLink = '', registrationClosed = false, collaborators = [], status = 'Published' } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Event title is required' });
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ message: 'Event description is required' });
  }
  if (!eventDate) {
    return res.status(400).json({ message: 'Event date is required' });
  }
  if (!Array.isArray(pictures) || pictures.length === 0) {
    return res.status(400).json({ message: 'At least one photo is required' });
  }
  if (pictures.length > 10) {
    return res.status(400).json({ message: 'Maximum 10 photos allowed per event' });
  }
  if (Array.isArray(tags) && tags.length > 3) {
    return res.status(400).json({ message: 'Maximum 3 tags allowed per event' });
  }

  const safeCollaborators = Array.isArray(collaborators)
    ? collaborators
        .filter(c => c && typeof c === 'object' && c.name && typeof c.name === 'string')
        .map(c => ({ name: c.name.trim(), logoUrl: (c.logoUrl || '').trim() }))
    : [];

  try {
    const store = await readStore(true);
    const oldData = normalizeWebsiteData(store.websiteData);
    const existingList = Array.isArray(oldData.eventsList) ? oldData.eventsList : [];

    const newEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description.trim(),
      tags: Array.isArray(tags) ? tags.slice(0, 3) : [],
      pictures: pictures.slice(0, 10),
      eventDate,
      eventTime: eventTime.trim(),
      venue: venue.trim(),
      attendees: attendees.trim(),
      registrationLink: sanitizeWebUrl(registrationLink),
      registrationClosed: Boolean(registrationClosed),
      collaborators: safeCollaborators,
      status: status === 'Draft' ? 'Draft' : 'Published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextEvents = [newEvent, ...existingList];
    const newData = { ...oldData, eventsList: nextEvents, timestamp: new Date().toLocaleString() };

    const historyEntry = { old: oldData, new: newData, changedBy: req.user.username };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: newData, history: nextHistory });
    await logAudit('CREATE_EVENT', req.user.username, { eventId: newEvent.id, title: newEvent.title });

    res.json({ message: 'Event created successfully', event: newEvent });
  } catch (err) {
    logError(`Create event error: ${err.message}`);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// ── Email template helpers (SMTP) ───────────────────────────────────────────

// Escape user-provided text to avoid breaking the HTML / HTML injection.
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Master email shell (responsive, tablet-style) with the club's heritage palette.
function emailShell({ title, kicker = '', children, footerNote }) {
  return `
    <!DOCTYPE html>
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0; padding:0; background:#f0e9dc; -webkit-font-smoothing:antialiased;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0e9dc;">
        <tr><td align="center" style="padding:32px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e5d9c2; box-shadow:0 12px 30px rgba(79,18,34,0.10);">
            <tr>
              <td style="background:linear-gradient(135deg,#7A1F34 0%,#4F1222 100%); padding:28px 30px 24px; border-bottom:4px solid #DFA92E; text-align:center;">
                <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#EE7F13; font-weight:800;">Rotaract Club of Swoyambhu</div>
                <div style="font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.25; color:#FFF8EC; margin:12px 0 10px; font-weight:800;">${title}</div>
                ${kicker ? `<span style="display:inline-block; font-family:Arial, Helvetica, sans-serif; background:#EE7F13; color:#ffffff; font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase; padding:5px 14px; border-radius:999px;">${kicker}</span>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:26px 30px; color:#3a231a; font-family:Arial, Helvetica, sans-serif;">${children}</td>
            </tr>
            <tr>
              <td style="background:#faf4e8; padding:18px 30px; border-top:1px solid #efe3cd;">
                <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#8a7362; text-align:center;">${footerNote}</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
}

// A labelled detail row (used for date / time / venue / attendees / tags / credentials).
function emailDetailRow(emoji, label, value) {
  return `
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #f3e9d6;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="32" valign="top" style="font-size:16px; line-height:1.2;">${emoji}</td>
            <td valign="top">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a3805f; font-weight:700;">${escapeHtml(label)}</div>
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:600; color:#3A231A; margin-top:2px;">${escapeHtml(value)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

// A primary action button used across email templates.
function emailPrimaryButton(href, label) {
  return `
    <div style="text-align:center; margin-top:26px;">
      <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block; font-family:Arial, Helvetica, sans-serif; background:linear-gradient(135deg,#EE7F13 0%,#DFA92E 100%); color:#3A2A12; padding:13px 34px; border-radius:999px; font-weight:800; font-size:14px; text-decoration:none; box-shadow:0 8px 22px rgba(238,127,19,0.35);">${label}</a>
    </div>`;
}

// ── SMTP transport ───────────────────────────────────────────────────────────
// Configurable via SMTP_HOST/SMTP_PORT/SMTP_SECURE (defaults to Gmail).
function getSmtpConfig() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || '';
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
  if (!user || !pass) return null;

  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user, pass },
  };
}

function createMailTransport() {
  const config = getSmtpConfig();
  if (!config) return null;
  return nodemailer.createTransport(config);
}

// Helper function to broadcast new event to email subscribers via Google SMTP
async function sendUpcomingEventBroadcast(event) {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP credentials (SMTP_USER and SMTP_PASS or GMAIL_APP_PASSWORD) are not configured in environment variables.');
  }

  let subscribers = [];
  try {
    if (postgresPool) {
      const res = await postgresPool.query('SELECT email FROM event_subscribers');
      subscribers.push(...res.rows.map(r => r.email));
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      const docs = await db.collection('event_subscribers').find().toArray();
      subscribers.push(...docs.map(d => d.email));
    }
    subscribers = Array.from(new Set(subscribers.map(e => e.toLowerCase())));
  } catch (e) {
    logError(`Failed to fetch subscribers for broadcast: ${e.message}`);
    throw new Error(`Failed to query event subscribers database: ${e.message}`);
  }

  if (subscribers.length === 0) {
    throw new Error('No email subscribers found in the database. Ask users to subscribe first on the Events page!');
  }

  const transporter = createMailTransport();
  if (!transporter) {
    throw new Error('SMTP credentials (SMTP_USER and SMTP_PASS or GMAIL_APP_PASSWORD) are not configured in environment variables.');
  }

  let sentCount = 0;
  // Send individual emails with personalized unsubscribe links
  for (const recipientEmail of subscribers) {
    const unsubUrl = `${process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',')[0] : 'http://localhost:5173'}/events?unsubscribe=true&email=${encodeURIComponent(recipientEmail)}`;
    
    const detailRows = [
      event.eventDate ? { emoji: '📅', label: 'Date', value: event.eventDate } : null,
      event.eventTime ? { emoji: '🕒', label: 'Time', value: event.eventTime } : null,
      event.venue ? { emoji: '📍', label: 'Venue', value: event.venue } : null,
      event.attendees ? { emoji: '👥', label: 'Attendees / Guests', value: event.attendees } : null,
      event.tags && event.tags.length ? { emoji: '🏷️', label: 'Tags', value: event.tags.join(', ') } : null,
    ].filter(Boolean);
    const detailsHtml = detailRows.map(d => emailDetailRow(d.emoji, d.label, d.value)).join('');

    const collaboratorsHtml = (Array.isArray(event.collaborators) && event.collaborators.length)
      ? `<p style="margin:18px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#5a4636; line-height:1.6;">🤝 <strong>In collaboration with:</strong> ${event.collaborators.map(c => escapeHtml(c.name)).join(' <span style="color:#DFA92E;">•</span> ')}</p>`
      : '';

    const regUrl = sanitizeWebUrl(event.registrationLink);
    const regButton = (regUrl && !event.registrationClosed)
      ? emailPrimaryButton(regUrl, 'Register for this event →')
      : '';

    const mailOptions = {
      from: `"Rotaract Club of Swoyambhu" <${smtpUser}>`,
      to: recipientEmail,
      subject: `🎉 Upcoming Event: ${event.title}`,
      html: emailShell({
        title: escapeHtml(event.title),
        kicker: 'Upcoming Event',
        children: `
          ${event.pictures && event.pictures.length ? `
            <img src="${event.pictures[0]}" alt="${escapeHtml(event.title)}" width="100%" style="width:100%; height:auto; display:block; border-radius:12px; margin:0 0 22px; border:1px solid #efe0c9;" />
          ` : ''}
          <p style="margin:0 0 6px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#4b3a30;">Hello,</p>
          <p style="margin:0 0 20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#4b3a30;">We're excited to invite you to an upcoming event by <strong>Rotaract Club of Swoyambhu</strong>. Here are all the details:</p>

          ${detailsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px; background:#fdf9f1; border:1px solid #efe3cb; border-radius:14px; padding:6px 18px;">${detailsHtml}</table>` : ''}

          <h3 style="margin:0 0 10px; font-family:Arial, Helvetica, sans-serif; font-size:15px; text-transform:uppercase; letter-spacing:1px; color:#7A1F34; font-weight:800;">About the event</h3>
          <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#3a231a; white-space:pre-line;">${escapeHtml(event.description)}</p>

          ${collaboratorsHtml}
          ${regButton}
        `,
        footerNote: `You are receiving this because you subscribed to event notifications at <strong>Rotaract Club of Swoyambhu</strong>.<br/>Want to stop receiving these? <a href="${unsubUrl}" style="color:#EF4444; text-decoration:underline;">Unsubscribe with 1-click</a>`,
      }),
    };

    try {
      await transporter.sendMail(mailOptions);
      sentCount++;
    } catch (err) {
      logWarn(`Failed to send event broadcast to ${recipientEmail}: ${err.message}`);
      throw new Error(`Failed to send email to subscriber (${recipientEmail}): ${err.message}`);
    }
  }

  if (sentCount === 0) {
    throw new Error('Could not send notification emails to any subscribers.');
  }

  return { count: sentCount };
}

// ── Public Event Subscription Endpoint ──────────────────────────────────────
app.post('/api/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.trim() || !email.includes('@')) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (postgresPool) {
      await postgresPool.query(
        'INSERT INTO event_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
        [cleanEmail]
      );
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('event_subscribers').updateOne(
        { email: cleanEmail },
        { $setOnInsert: { email: cleanEmail, subscribedAt: new Date() } },
        { upsert: true }
      );
    }

    // Confirmation email with Unsubscribe link
    const frontendUrl = process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',')[0] : 'http://localhost:5173';
    const unsubUrl = `${frontendUrl}/events?unsubscribe=true&email=${encodeURIComponent(cleanEmail)}`;

    let emailSent = false;
    let emailError = '';
    const transporter = createMailTransport();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Rotaract Club of Swoyambhu" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
          to: cleanEmail,
          subject: 'Subscribed to Rotaract Club of Swoyambhu Events',
          html: emailShell({
            title: 'Subscription Confirmed 🎉',
            kicker: 'You\u2019re on the list',
            children: `
              <p style="margin:0 0 14px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#3a231a;">Thank you for subscribing to <strong>Rotaract Club of Swoyambhu</strong> event notifications.</p>
              <p style="margin:0 0 20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#4b3a30;">You will now automatically receive every upcoming community, youth development, and cultural event — including dates, venues, and registration links — directly in your inbox. Stay tuned!</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf9f1; border:1px solid #efe3cb; border-radius:14px; padding:6px 18px;">
                ${emailDetailRow('✉️', 'Subscribed email', cleanEmail)}
              </table>
              <div style="text-align:center; margin-top:22px;">
                <a href="${unsubUrl}" style="font-family:Arial, Helvetica, sans-serif; color:#EF4444; font-size:13px; text-decoration:underline;">Click here to Unsubscribe / Stop receiving notifications</a>
              </div>
            `,
            footerNote: 'Warm regards,<br/>Rotaract Club of Swoyambhu Team',
          }),
        });
        emailSent = true;
      } catch (err) {
        emailError = String(err && err.message || err).slice(0, 300);
        logError(`Subscribe confirmation email failed for ${cleanEmail}: ${emailError}`);
      }
    } else {
      emailError = 'SMTP not configured (SMTP_USER/SMTP_PASS missing)';
      logWarn(`Subscribe confirmation email skipped: ${emailError}`);
    }

    res.json({
      message: 'Subscribed successfully! You will now receive all upcoming events in your email.',
      emailSent,
      ...(emailError ? { emailError } : {}),
    });
  } catch (err) {
    logError(`Subscribe error: ${err.message}`);
    res.status(500).json({ message: 'Failed to subscribe. Please try again.' });
  }
});

// ── Public Event Unsubscribe Endpoint ──────────────────────────────────────
app.post('/api/unsubscribe', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.trim() || !email.includes('@')) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (postgresPool) {
      await postgresPool.query('DELETE FROM event_subscribers WHERE LOWER(email) = $1', [cleanEmail]);
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('event_subscribers').deleteOne({ email: cleanEmail });
    }

    res.json({ message: 'You have been successfully unsubscribed from event notifications.' });
  } catch (err) {
    logError(`Unsubscribe error: ${err.message}`);
    res.status(500).json({ message: 'Failed to unsubscribe. Please try again.' });
  }
});

app.put('/api/admin/events/:id', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('EVENT_MANAGER') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires EVENT_MANAGER or SUPERADMIN' });
  }

  const { id } = req.params;
  const { title, description = '', tags = [], pictures = [], eventDate, eventTime = '', venue = '', attendees = '', registrationLink = '', registrationClosed = false, collaborators = [], status = 'Published' } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Event title is required' });
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ message: 'Event description is required' });
  }
  if (!eventDate) {
    return res.status(400).json({ message: 'Event date is required' });
  }
  if (!Array.isArray(pictures) || pictures.length === 0) {
    return res.status(400).json({ message: 'At least one photo is required' });
  }
  if (pictures.length > 10) {
    return res.status(400).json({ message: 'Maximum 10 photos allowed per event' });
  }
  if (Array.isArray(tags) && tags.length > 3) {
    return res.status(400).json({ message: 'Maximum 3 tags allowed per event' });
  }

  const safeCollaborators = Array.isArray(collaborators)
    ? collaborators
        .filter(c => c && typeof c === 'object' && c.name && typeof c.name === 'string')
        .map(c => ({ name: c.name.trim(), logoUrl: (c.logoUrl || '').trim() }))
    : [];

  try {
    const store = await readStore(true);
    const oldData = normalizeWebsiteData(store.websiteData);
    const existingList = Array.isArray(oldData.eventsList) ? oldData.eventsList : [];

    const index = existingList.findIndex(e => e.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updatedEvent = {
      ...existingList[index],
      title: title.trim(),
      description: description.trim(),
      tags: Array.isArray(tags) ? tags.slice(0, 3) : [],
      pictures: pictures.slice(0, 10),
      eventDate,
      eventTime: eventTime.trim(),
      venue: venue.trim(),
      attendees: attendees.trim(),
      registrationLink: sanitizeWebUrl(registrationLink),
      registrationClosed: Boolean(registrationClosed),
      collaborators: safeCollaborators,
      status: status === 'Draft' ? 'Draft' : 'Published',
      updatedAt: new Date().toISOString(),
    };

    const nextEvents = [...existingList];
    nextEvents[index] = updatedEvent;

    const newData = { ...oldData, eventsList: nextEvents, timestamp: new Date().toLocaleString() };

    const historyEntry = { old: oldData, new: newData, changedBy: req.user.username };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: newData, history: nextHistory });
    await logAudit('UPDATE_EVENT', req.user.username, { eventId: id, title: updatedEvent.title });

    res.json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (err) {
    logError(`Update event error: ${err.message}`);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// Explicit Notify Subscribers Endpoint for Upcoming Events
app.post('/api/admin/events/:id/notify-subscribers', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('EVENT_MANAGER') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires EVENT_MANAGER or SUPERADMIN' });
  }

  const { id } = req.params;

  try {
    const store = await readStore(true);
    const oldData = normalizeWebsiteData(store.websiteData);
    const existingList = Array.isArray(oldData.eventsList) ? oldData.eventsList : [];

    const index = existingList.findIndex(e => e.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = existingList[index];

    // Check if upcoming
    const todayStr = new Date().toISOString().split('T')[0];
    if (event.eventDate < todayStr) {
      return res.status(400).json({ message: 'Notifications can only be sent for upcoming events.' });
    }

    if (event.status === 'Draft') {
      return res.status(400).json({ message: 'Notifications cannot be sent for Draft events. Please publish the event first.' });
    }

    if (event.notifiedSubscribers) {
      return res.status(400).json({ message: 'Notifications have already been sent for this event.' });
    }

    // Broadcast email to subscribers
    const broadcastResult = await sendUpcomingEventBroadcast(event);

    // Mark event as notified
    const updatedEvent = {
      ...event,
      notifiedSubscribers: true,
      notifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextEvents = [...existingList];
    nextEvents[index] = updatedEvent;

    const newData = { ...oldData, eventsList: nextEvents, timestamp: new Date().toLocaleString() };
    const historyEntry = { old: oldData, new: newData, changedBy: req.user.username };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: newData, history: nextHistory });
    await logAudit('NOTIFY_EVENT_SUBSCRIBERS', req.user.username, { eventId: id, title: event.title });

    res.json({ message: 'Subscribers successfully notified!', event: updatedEvent, count: broadcastResult?.count || 0 });
  } catch (err) {
    logError(`Notify subscribers error: ${err.message}`);
    res.status(500).json({ message: `Failed to notify subscribers: ${err.message}` });
  }
});

// Endpoint to reset all event notified states
app.post('/api/admin/events/reset-notified', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('EVENT_MANAGER') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires EVENT_MANAGER or SUPERADMIN' });
  }

  try {
    const store = await readStore(true);
    const oldData = normalizeWebsiteData(store.websiteData);
    const existingList = Array.isArray(oldData.eventsList) ? oldData.eventsList : [];

    const nextEvents = existingList.map(e => ({
      ...e,
      notifiedSubscribers: false,
      notifiedAt: null
    }));

    const newData = { ...oldData, eventsList: nextEvents, timestamp: new Date().toLocaleString() };
    const historyEntry = { old: oldData, new: newData, changedBy: req.user.username };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: newData, history: nextHistory });
    await logAudit('RESET_EVENT_NOTIFIED_STATES', req.user.username, {});

    res.json({ message: 'All event notified states have been reset successfully!', events: nextEvents });
  } catch (err) {
    logError(`Reset notified error: ${err.message}`);
    res.status(500).json({ message: 'Failed to reset notified states.' });
  }
});

app.delete('/api/admin/events/:id', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('EVENT_MANAGER') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires EVENT_MANAGER or SUPERADMIN' });
  }

  const { id } = req.params;

  try {
    const store = await readStore(true);
    const oldData = normalizeWebsiteData(store.websiteData);
    const existingList = Array.isArray(oldData.eventsList) ? oldData.eventsList : [];

    const nextEvents = existingList.filter(e => e.id !== id);

    // Clean up any albums still linked to the deleted event so they don't keep a stale eventId
    const existingAlbums = Array.isArray(oldData.albums) ? oldData.albums : [];
    const albumsChanged = existingAlbums.some(a => (a.eventId || '') === id);
    const nextAlbums = existingAlbums.map(a =>
      (a.eventId || '') === id ? { ...a, eventId: '' } : a
    );

    const newData = {
      ...oldData,
      eventsList: nextEvents,
      albums: nextAlbums,
      timestamp: new Date().toLocaleString(),
    };

    const historyEntry = { old: oldData, new: newData, changedBy: req.user.username };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: newData, history: nextHistory });
    await logAudit('DELETE_EVENT', req.user.username, { eventId: id, albumsCleaned: albumsChanged });

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    logError(`Delete event error: ${err.message}`);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// Toggle Priority Event — only one event can be priority at a time
app.put('/api/admin/events/:id/priority', requireAuth, async (req, res) => {
  if (!req.user.permissions?.includes('EVENT_MANAGER') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires EVENT_MANAGER or SUPERADMIN' });
  }

  const { id } = req.params;

  try {
    const store = await readStore(true);
    const oldData = normalizeWebsiteData(store.websiteData);
    const existingList = Array.isArray(oldData.eventsList) ? oldData.eventsList : [];

    const targetIndex = existingList.findIndex(e => e.id === id);
    if (targetIndex === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isCurrentlyPriority = Boolean(existingList[targetIndex].isPriority);

    // Toggle: if already priority → remove it; if not → set it and clear all others
    const nextEvents = existingList.map((ev, i) => ({
      ...ev,
      isPriority: !isCurrentlyPriority && i === targetIndex,
    }));

    const newData = { ...oldData, eventsList: nextEvents, timestamp: new Date().toLocaleString() };
    const historyEntry = { old: oldData, new: newData, changedBy: req.user.username };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: newData, history: nextHistory });
    await logAudit('SET_PRIORITY_EVENT', req.user.username, { eventId: id, isPriority: !isCurrentlyPriority });

    res.json({
      message: !isCurrentlyPriority ? 'Event set as priority!' : 'Priority event cleared.',
      isPriority: !isCurrentlyPriority,
      events: nextEvents,
    });
  } catch (err) {
    logError(`Set priority event error: ${err.message}`);
    res.status(500).json({ message: 'Failed to update priority event' });
  }
});

// ── Image Upload ──────────────────────────────────────────────────────────────
// Uses requireAuth (HttpOnly cookie) — same as all other admin routes.
// The frontend sends credentials: 'include' (no Bearer token needed).
app.post('/api/admin/upload', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.' });
    }

    // Validate file size (max 10 MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'File too large. Maximum size is 10 MB.' });
    }

    // Hash the file bytes for deduplication
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Check if this exact image was already uploaded
    if (postgresPool) {
      try {
        const existing = await postgresPool.query(
          'SELECT url FROM image_hashes WHERE sha256 = $1 LIMIT 1',
          [fileHash]
        );
        if (existing.rows.length > 0) {
          const storedUrl = existing.rows[0].url;
          const filePath = extractImageKitPath(storedUrl);
          const alive = filePath ? await isImageKitFileAlive(filePath) : false;
          if (alive) {
            logInfo(`Dedup hit — reusing existing image: ${storedUrl}`);
            return res.json({ url: storedUrl, deduplicated: true });
          }
          logWarn(`Dedup URL no longer exists on ImageKit (${storedUrl}) — will re-upload`);
        }
      } catch (hashLookupErr) {
        logWarn(`Hash lookup failed (non-fatal): ${hashLookupErr.message}`);
      }
    }

    // Check if ImageKit is properly configured
    const ikPublicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
    const ikPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    const isIkConfigured = ikPublicKey && ikPrivateKey &&
      !['your_public_key', 'dummy_public_key'].includes(ikPublicKey) &&
      !['your_private_key', 'dummy_private_key'].includes(ikPrivateKey);

    if (!isIkConfigured) {
      return res.status(503).json({
        message: 'ImageKit is not configured on the server. Images can only be previewed locally.',
        code: 'IMAGEKIT_NOT_CONFIGURED',
      });
    }

    const safeFileName = (req.file.originalname || `upload_${Date.now()}.jpg`)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 100);

    const uploadResponse = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: safeFileName,
      folder: '/rotaract',
    });

    // Store hash → URL for future deduplication
    if (postgresPool) {
      try {
        await postgresPool.query(
          `INSERT INTO image_hashes (sha256, url, original_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (sha256) DO UPDATE SET url = EXCLUDED.url,
             original_name = EXCLUDED.original_name, uploaded_at = NOW()`,
          [fileHash, uploadResponse.url, req.file.originalname || null]
        );
      } catch (hashStoreErr) {
        logWarn(`Hash store failed (non-fatal): ${hashStoreErr.message}`);
      }
    }

    logInfo(`Image uploaded to ImageKit: ${uploadResponse.url}`);
    res.json({ url: uploadResponse.url });
  } catch (err) {
    logError(`ImageKit upload error: ${err.message}`);
    const reportId = await logErrorToDb({
      errorMessage: `Image upload failed: ${err.message}`,
      errorStack: err.stack,
      errorCode: 'UPLOAD_FAILED',
      endpoint: '/api/admin/upload',
      method: 'POST',
      statusCode: 500,
      username: req.user?.username || 'admin',
      userRole: req.user?.role || 'ADMIN',
      requestPayload: {
        filename: req.file?.originalname,
        size: req.file?.size,
        mimetype: req.file?.mimetype,
      },
    });

    res.status(500).json({
      message: 'Failed to upload image. Please try again.',
      error: err.message,
      reportId,
    });
  }
});

// Delete an app-uploaded image from ImageKit (best-effort, reference-counted).
// The client calls this when an image is removed or replaced, so orphaned
// files don't accumulate in the /rotaract library. The file is only actually
// deleted once it is no longer referenced ANYWHERE in the current content —
// an image reused across multiple pages/sections is kept until the last
// reference is gone.
app.post('/api/admin/delete-image', requireAuth, async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'No image URL provided' });
  }

  try {
    const store = await readStore(true);
    const references = countImageReferences(store?.websiteData || {}, url);
    if (references > 0) {
      logInfo(`Image still referenced ${references}× — keeping: ${url}`);
      return res.json({ deleted: false, reason: 'STILL_REFERENCED', references });
    }
  } catch (err) {
    logWarn(`Image reference check failed (non-fatal, keeping image): ${err.message}`);
    return res.json({ deleted: false, reason: 'REFERENCE_CHECK_FAILED' });
  }

  const result = await deleteImageFromImageKit(url);
  res.json(result);
});

if (process.env.NODE_ENV !== 'production') {
  initStorage()
    .then(() => {
      storageInitialized = true;
      app.listen(PORT, '0.0.0.0', () => {
        logInfo(`Admin API running on http://localhost:${PORT}`);
        console.log(`${ansi.cyan}[api]${ansi.reset} Active storage provider: ${activeStorage}`);
        console.log(`${ansi.cyan}[api]${ansi.reset} Frontend origins: ${FRONTEND_ORIGINS.join(', ')}`);
      });
    })
    .catch((error) => {
      logError(`Failed to initialize storage: ${error.message}`);
      process.exit(1);
    });
}

export default app;
