import pg from 'pg'

const { Pool } = pg
let pool
let schemaPromise
const retryableCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', '57P01', '57P02', '57P03'])

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('Missing required environment variable: DATABASE_URL')
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
      keepAlive: true,
    })
    pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error:', error.message))
  }
  return pool
}

export async function query(text, values = []) {
  const retries = Number(process.env.DB_QUERY_RETRIES || 3)
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await getPool().query(text, values)
    } catch (error) {
      if (!retryableCodes.has(error.code) || attempt === retries) throw error
      await delay(250 * 2 ** attempt)
    }
  }
}

export function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT REFERENCES categories(id)
      );
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL,
        category_name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        phone TEXT,
        website TEXT,
        description TEXT,
        image TEXT,
        gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
        status TEXT,
        submitted_by TEXT
      );
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        detail TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        image TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        phone TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS favorites (
        user_phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
        business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        created_by TEXT NOT NULL REFERENCES users(phone),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by TEXT NOT NULL REFERENCES users(phone),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_phone, business_id)
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        user_phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
        rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL DEFAULT '',
        created_by TEXT NOT NULL REFERENCES users(phone),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by TEXT NOT NULL REFERENCES users(phone),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS feedback_submissions (
        id TEXT PRIMARY KEY,
        user_phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('Feedback', 'Complaint')),
        subject TEXT NOT NULL,
        contact TEXT,
        message TEXT NOT NULL,
        created_by TEXT NOT NULL REFERENCES users(phone),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by TEXT NOT NULL REFERENCES users(phone),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_by TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_by TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE businesses ADD COLUMN IF NOT EXISTS created_by TEXT;
      ALTER TABLE businesses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_by TEXT;
      ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE businesses ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
      ALTER TABLE businesses ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
      ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by TEXT;
      ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_by TEXT;
      ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `).catch((error) => {
      schemaPromise = undefined
      throw error
    })
  }
  return schemaPromise
}