import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import multer from 'multer';
import ImageKit from 'imagekit';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
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
  aboutEn: 'Rotaract is a global movement of young leaders who are developing innovative solutions to the world\'s most pressing challenges. We bring together adults ages 18–30 to take action in their communities, develop their leadership and professional skills, and have fun.\n\nThe Rotaract Club of Swoyambhu is deeply rooted in the spiritual and cultural heart of Kathmandu. Inspired by the wisdom eyes of Swoyambhu, we aim to serve with clarity, compassion, and a profound respect for our heritage.',
  aboutNe: 'रोटर्याक्ट युवा नेताहरूको एक विश्वव्यापी आन्दोलन हो जो संसारका सबैभन्दा ठूला चुनौतीहरूको लागि अभिनव समाधानहरू विकास गर्दैछ। हामी समुदायमा कार्य गर्न, नेतृत्व र व्यावसायिक सीपहरू विकास गर्न १८–३० वर्षका युवाहरूलाई एकसाथ ल्याउँछौं।\n\nस्वयम्भू रोटर्याक्ट क्लब काठमाडौंको आध्यात्मिक र सांस्कृतिक केन्द्रमा गहिरो जरा गाडेको छ। स्वयम्भूका ज्ञान नेत्रहरूबाट प्रेरित भएर, हामी स्पष्टता, करुणा र हाम्रो सम्पदाप्रति गहिरो सम्मानका साथ सेवा गर्ने लक्ष्य राख्छौं।',
  team: [
    { id: '1', name: 'Rtr. Subina Magar', roleEn: 'President', roleNe: 'अध्यक्ष', imgUrl: '/src/assets/images/president.jpg' },
    { id: '2', name: 'Rtr. Darsana dd', roleEn: 'Vice President', roleNe: 'उपाध्यक्ष', imgUrl: '/src/assets/images/img4.jpg' },
    { id: '3', name: 'Rtr. Jenisha Gautam', roleEn: 'Secretary', roleNe: 'सचिव', imgUrl: '/src/assets/images/Secretary.jpg' },
    { id: '4', name: 'Rtr. Smriti Adhikari', roleEn: 'Professional Development Chair', roleNe: 'कोषाध्यक्ष', imgUrl: '/src/assets/images/pdc.jpg' },
  ],
  initiatives: [
    { id: '1', titleEn: 'Community Service', titleNe: 'समाज सेवा', desc: 'Grassroots level projects focusing on education, health, and sustainable environment in the local Swoyambhu area and beyond.', iconSvg: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { id: '2', titleEn: 'Professional Development', titleNe: 'व्यावसायिक विकास', desc: 'Workshops, mentorship programs, and networking events designed to elevate the skills and career trajectories of our youth.', iconSvg: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z' },
    { id: '3', titleEn: 'Cultural Preservation', titleNe: 'संस्कृति संरक्षण', desc: 'Initiatives dedicated to maintaining the aesthetic and spiritual heritage of Swoyambhu, from clean-ups to awareness campaigns.', iconSvg: 'M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm5 15h-2v-6H9v6H7v-7.81l5-4.5 5 4.5V18z' },
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
  eventsList: [],
  timestamp: '',
};

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'dummy_public_key',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'dummy_private_key',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/dummy',
});

const upload = multer({ storage: multer.memoryStorage() });

let mongoClient;
let mongoCollection = null;
let postgresPool = null;
let activeStorage = 'uninitialized';
let cachedStore = null;

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
app.use(express.json({ limit: '20kb' }));

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
    eventsList: Array.isArray(data.eventsList) ? data.eventsList : [],
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

  // ── Array field checks ─────────────────────────────────────────────────────
  const MAX_ITEMS = 20;

  if (data.team != null) {
    if (!Array.isArray(data.team)) return 'team must be an array';
    if (data.team.length > MAX_ITEMS) return `team exceeds max items (${MAX_ITEMS})`;
    for (const [i, m] of data.team.entries()) {
      if (!m || typeof m !== 'object') return `team[${i}] is invalid`;
      if (m.name != null && (typeof m.name !== 'string' || m.name.length > 200)) return `team[${i}].name is invalid`;
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

    // Ensure email column exists on existing installations
    await postgresPool.query(`
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS email TEXT;
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
      CREATE TABLE IF NOT EXISTS event_subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
      serverSelectionTimeoutMS: 5000,
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

async function readStore() {
  if (cachedStore) {
    return cachedStore;
  }

  if (mongoCollection) {
    try {
      const doc = await mongoCollection.findOne({ _id: DOC_ID });
      if (doc) {
        const store = normalizeStore(doc);
        cachedStore = store;
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
      cachedStore = normalizeStore(seedStore);
      activeStorage = 'mongodb';
      return cachedStore;
    } catch (error) {
      logWarn(`MongoDB read failed, switching to PostgreSQL backup: ${error.message}`);
    }
  }

  if (postgresPool) {
    const backupStore = await readFromPostgresBackup();
    activeStorage = 'postgres-backup';
    cachedStore = backupStore || { websiteData: { ...websiteDefaults }, history: [] };
    return cachedStore;
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
    cachedStore = safeStore;
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
      cachedStore = safeStore;
      return;
    } catch (error) {
      logWarn(`MongoDB write failed, persisting to PostgreSQL backup: ${error.message}`);
    }
  }

  if (postgresPool) {
    await writeToPostgresBackup(safeStore);
    activeStorage = 'postgres-backup';
    cachedStore = safeStore;
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
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('audit_logs').insertOne({
        action,
        username,
        details,
        created_at: new Date()
      });
    }
  } catch (err) {
    logError(`Failed to save audit log: ${err.message}`);
  }
}

async function seedDefaultSuperAdmin() {
  const superAdminUsername = 'sohail';
  const superAdminPassHash = sha256('Sohailk@2064');

  try {
    const existing = await getAdminByUsername(superAdminUsername);
    const adminData = {
      username: superAdminUsername,
        password_hash: superAdminPassHash,
        role: 'SUPERADMIN',
        permissions: ['VISUAL_EDITOR', 'ACCOUNT_PASSWORD_RESET', 'VIEW_LOGS', 'DEACTIVATE_ACCOUNT', 'DELETE_ACCOUNT', 'ADMIN_CREATOR', 'EVENT_MANAGER'],
        is_temporary_password: false,
        is_active: true,
        passkeys: []
      };
      
      if (postgresPool) {
        await postgresPool.query(
          `INSERT INTO admins (username, password_hash, role, permissions, is_temporary_password, is_active, passkeys) 
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb) 
           ON CONFLICT (username) DO UPDATE SET permissions = EXCLUDED.permissions`,
          [adminData.username, adminData.password_hash, adminData.role, JSON.stringify(adminData.permissions), adminData.is_temporary_password, adminData.is_active, JSON.stringify(adminData.passkeys)]
        );
      }
      if (mongoCollection) {
        const db = mongoClient.db(MONGODB_DB_NAME);
        const { permissions, ...insertData } = adminData;
        await db.collection('admins').updateOne(
          { username: superAdminUsername },
          { $setOnInsert: insertData, $set: { permissions: adminData.permissions } },
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
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
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

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
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

// Public content — no-store so browsers & CDNs never cache stale content
app.get('/api/content', async (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600');
  try {
    const store = await readStore();
    res.json({ websiteData: store.websiteData });
  } catch {
    res.status(500).json({ message: 'Failed to load content' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { username = '', password = '' } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid credentials payload' });
  }

  const admin = await getAdminByUsername(username.trim());
  if (!admin) {
    return res.status(401).json({ message: 'Incorrect credentials. Please try again.' });
  }
  
  if (!admin.is_active) {
    return res.status(403).json({ message: 'Account is deactivated.' });
  }

  const passwordHash = sha256(String(password));
  if (!safeEqualHex(passwordHash, admin.password_hash)) {
    return res.status(401).json({ message: 'Incorrect credentials. Please try again.' });
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
    const store = await readStore();
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
    const store = await readStore();

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

    const store = await readStore();
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
    const store = await readStore();
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
  if (!req.user.permissions?.includes('ADMIN_CREATOR') && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    let admins = [];
    if (postgresPool) {
      const result = await postgresPool.query('SELECT username, email, role, permissions, is_active, is_temporary_password FROM admins');
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
  const passHash = sha256(tempPassword);
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
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"Rotaract Club of Swoyambhu" <${smtpUser}>`,
      to: email,
      subject: 'Welcome to Rotaract Club of Swoyambhu Admin C-Panel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
          <h2 style="color: #0F172A; margin-top: 0;">Admin Account Created</h2>
          <p style="color: #475569; font-size: 15px;">Hello,</p>
          <p style="color: #475569; font-size: 15px;">An administrative account has been created for you at <strong>Rotaract Club of Swoyambhu Control Panel</strong>.</p>
          
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 20px 0;">
            <p style="margin: 4px 0; color: #1e293b;"><strong>Username:</strong> <code style="font-size: 16px; background: #e2e8f0; padding: 2px 6px; borderRadius: 4px;">${username}</code></p>
            <p style="margin: 4px 0; color: #1e293b;"><strong>Temporary Password:</strong> <code style="font-size: 16px; background: #e2e8f0; padding: 2px 6px; borderRadius: 4px;">${tempPassword}</code></p>
          </div>

          <p style="color: #ef4444; font-size: 14px; font-weight: 600;">⚠️ For security reasons, you will be prompted to change this temporary password upon your first sign-in.</p>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">Regards,<br>Rotaract Club of Swoyambhu Executive Team</p>
        </div>
      `,
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
  
  try {
    if (postgresPool) {
      await postgresPool.query('DELETE FROM admins WHERE username = $1', [username]);
    }
    if (mongoCollection) {
      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.collection('admins').deleteOne({ username });
    }
    await logAudit('DELETE_ADMIN', req.user.username, { targetAdmin: username });
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete admin' });
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
  
  if (!safeEqualHex(sha256(currentPassword), admin.password_hash)) {
    return res.status(401).json({ message: 'Incorrect current password' });
  }
  
  const newHash = sha256(newPassword);
  
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
  
  const newHash = sha256(newPassword);
  
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

// ── Event Management APIs ───────────────────────────────────────────────────

app.get('/api/events', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600');
    const store = await readStore();
    const allEvents = Array.isArray(store.websiteData?.eventsList) ? store.websiteData.eventsList : [];
    // Public only gets published events
    const published = sanitizeEventsList(allEvents.filter(e => e.status !== 'Draft'));
    res.json(published);
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
    const store = await readStore();
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

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
  });

  let sentCount = 0;
  // Send individual emails with personalized unsubscribe links
  for (const recipientEmail of subscribers) {
    const unsubUrl = `${process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',')[0] : 'http://localhost:5173'}/events?unsubscribe=true&email=${encodeURIComponent(recipientEmail)}`;
    
    const mailOptions = {
      from: `"Rotaract Club of Swoyambhu" <${smtpUser}>`,
      to: recipientEmail,
      subject: `🎉 Upcoming Event Announcement: ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background: #FF8A00; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">Upcoming Event</span>
            <h2 style="color: #0F172A; margin: 12px 0 6px;">${event.title}</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">📅 ${event.eventDate} ${event.eventTime ? `@ ${event.eventTime}` : ''}</p>
          </div>

          ${event.pictures && event.pictures.length > 0 ? `
            <div style="width: 100%; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <img src="${event.pictures[0]}" alt="${event.title}" style="width: 100%; height: auto; display: block;" />
            </div>
          ` : ''}

          <p style="color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-line;">${event.description}</p>

          ${event.attendees ? `<p style="color: #475569; font-size: 14px; background: #f8fafc; padding: 10px 14px; border-radius: 8px;">👥 Attendees / Guests: <strong>${event.attendees}</strong></p>` : ''}

          ${sanitizeWebUrl(event.registrationLink) && !event.registrationClosed ? `
            <div style="text-align: center; margin-top: 28px;">
              <a href="${sanitizeWebUrl(event.registrationLink)}" target="_blank" rel="noopener noreferrer" style="background: #FF8A00; color: #ffffff; padding: 12px 28px; border-radius: 25px; font-weight: 700; text-decoration: none; display: inline-block;">
                Register For Event →
              </a>
            </div>
          ` : ''}

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0 16px;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            You received this email because you subscribed to event notifications at Rotaract Club of Swoyambhu.<br />
            Want to stop receiving notifications? <a href="${unsubUrl}" style="color: #ef4444; text-decoration: underline;">Unsubscribe with 1-click</a>
          </p>
        </div>
      `,
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
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    const frontendUrl = process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',')[0] : 'http://localhost:5173';
    const unsubUrl = `${frontendUrl}/events?unsubscribe=true&email=${encodeURIComponent(cleanEmail)}`;

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      });
      transporter.sendMail({
        from: `"Rotaract Club of Swoyambhu" <${smtpUser}>`,
        to: cleanEmail,
        subject: 'Subscribed to Rotaract Club of Swoyambhu Events',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px;">
            <h2 style="color: #0F172A; margin-top: 0;">Subscription Confirmed! 🎉</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Thank you for subscribing to <strong>Rotaract Club of Swoyambhu</strong> event notifications. You will now automatically receive updates and invitations for all our upcoming community, youth development, and cultural events directly in your inbox.
            </p>
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center;">
              <a href="${unsubUrl}" style="color: #ef4444; font-size: 13px; text-decoration: underline;">
                Click here to Unsubscribe / Stop receiving notifications
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 14px;">Warm regards,<br>Rotaract Club of Swoyambhu Team</p>
          </div>
        `
      }).catch(e => logWarn(`Subscribe confirmation email error: ${e.message}`));
    }

    res.json({ message: 'Subscribed successfully! You will now receive all upcoming events in your email.' });
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
    const store = await readStore();
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
    const store = await readStore();
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
    const store = await readStore();
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
    const store = await readStore();
    const oldData = normalizeWebsiteData(store.websiteData);
    const existingList = Array.isArray(oldData.eventsList) ? oldData.eventsList : [];

    const nextEvents = existingList.filter(e => e.id !== id);
    const newData = { ...oldData, eventsList: nextEvents, timestamp: new Date().toLocaleString() };

    const historyEntry = { old: oldData, new: newData, changedBy: req.user.username };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: newData, history: nextHistory });
    await logAudit('DELETE_EVENT', req.user.username, { eventId: id });

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    logError(`Delete event error: ${err.message}`);
    res.status(500).json({ message: 'Failed to delete event' });
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

    logInfo(`Image uploaded to ImageKit: ${uploadResponse.url}`);
    res.json({ url: uploadResponse.url });
  } catch (err) {
    logError(`ImageKit upload error: ${err.message}`);
    res.status(500).json({ message: 'Failed to upload image. Please try again.' });
  }
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
