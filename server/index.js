import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import multer from 'multer';
import ImageKit from 'imagekit';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'rotaractclubofswoyambhu';
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION || 'content';
const POSTGRES_BACKUP_URL = process.env.POSTGRES_BACKUP_URL || '';
const POSTGRES_BACKUP_TABLE = process.env.POSTGRES_BACKUP_TABLE || 'website_content';
// STRICT_DUAL_WRITE: both DBs must succeed on every write.
// Set STRICT_DUAL_WRITE=false in .env to revert to soft-fallback mode.
const STRICT_DUAL_WRITE = process.env.STRICT_DUAL_WRITE !== 'false';
const AUTH_COOKIE_NAME = 'admin_session';

const DEFAULT_HASHED_EMAIL = 'a1bb4ee454f84c9f8bc627b7a4f56811c3527312a66ac9a3bad21e9bba47155c';
const DEFAULT_HASHED_PASSWORD = 'de4f46aafeb3bb9e06e980b81b90b8a86360cbfb288f9afb0dc3a0a4aca2b365';
const HASHED_EMAIL = process.env.ADMIN_EMAIL_HASH || DEFAULT_HASHED_EMAIL;
const HASHED_PASSWORD = process.env.ADMIN_PASSWORD_HASH || DEFAULT_HASHED_PASSWORD;

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

async function initStorage() {
  await connectPostgresBackup();
  await connectMongo();

  if (!mongoCollection && !postgresPool) {
    throw new Error('Neither MongoDB nor PostgreSQL backup is configured/available');
  }

  // ── Startup Integrity Check ───────────────────────────────────────────────
  if (mongoCollection && postgresPool) {
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
  res.setHeader('Cache-Control', 'no-store');
  try {
    const store = await readStore();
    res.json({ websiteData: store.websiteData });
  } catch {
    res.status(500).json({ message: 'Failed to load content' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { email = '', password = '' } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid credentials payload' });
  }

  if (email.length > 320 || password.length > 256) {
    return res.status(400).json({ message: 'Invalid credentials length' });
  }

  const emailHash = sha256(String(email).trim().toLowerCase());
  const passwordHash = sha256(String(password));
  const emailOk = safeEqualHex(emailHash, HASHED_EMAIL);
  const passOk = safeEqualHex(passwordHash, HASHED_PASSWORD);

  if (!emailOk || !passOk) {
    return res.status(401).json({ message: 'Incorrect credentials. Please try again.' });
  }

  const token = jwt.sign(
    { role: 'admin' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );

  setAuthCookie(res, token);

  return res.json({ authenticated: true });
});

app.post('/api/admin/logout', (_req, res) => {
  clearAuthCookie(res);
  return res.json({ message: 'Logged out' });
});

app.get('/api/admin/session', requireAuth, (_req, res) => {
  res.json({ authenticated: true });
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

    const historyEntry = { old: oldData, new: newData };
    const nextHistory = [historyEntry, ...store.history].slice(0, 10);

    await writeStore({ websiteData: newData, history: nextHistory });

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
