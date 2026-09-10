"use strict";

const fs = require("fs");
const path = require("path");

const SAVE_DIR = path.join(__dirname, "saves");
const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();
const DB_SYNC_INTERVAL_MS = Math.max(1000, Number(process.env.NSD_DB_SYNC_MS) || 2500);
const DB_TABLE = "night_shift_duo_saves";

function ensureSaveDir() {
  if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });
}

function safeSaveFileName(name) {
  name = path.basename(String(name || ""));
  if (!/^[a-z0-9_-]+\.json$/i.test(name) && name !== "accounts.json") return null;
  return name;
}

function listSaveFiles() {
  ensureSaveDir();
  return fs.readdirSync(SAVE_DIR)
    .filter(name => safeSaveFileName(name))
    .sort();
}

function readJsonFile(name) {
  const safe = safeSaveFileName(name);
  if (!safe) return null;
  try {
    const raw = fs.readFileSync(path.join(SAVE_DIR, safe), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJsonFile(name, payload) {
  const safe = safeSaveFileName(name);
  if (!safe) return;
  ensureSaveDir();
  const target = path.join(SAVE_DIR, safe);
  const tmp = `${target}.dbtmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf8");
  fs.renameSync(tmp, target);
}

function stableJson(value) {
  try { return JSON.stringify(value); } catch { return ""; }
}

async function startWithFileSaves() {
  console.warn("[DB] DATABASE_URL is not set. Using local JSON saves only.");
  const game = require("./server");
  game.startRuntime();
}

async function startWithPostgres() {
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: Math.max(2, Math.min(10, Number(process.env.NSD_DB_POOL_MAX) || 4)),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  ensureSaveDir();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${DB_TABLE} (
      save_key TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS ${DB_TABLE}_updated_at_idx ON ${DB_TABLE}(updated_at)`);

  const knownDbKeys = new Set();
  const restored = await pool.query(`SELECT save_key, payload FROM ${DB_TABLE}`);
  for (const row of restored.rows) {
    const key = safeSaveFileName(row.save_key);
    if (!key) continue;
    knownDbKeys.add(key);
    writeJsonFile(key, row.payload);
  }

  // First migration: if Render still has a JSON save that never reached Postgres,
  // import it once. If a key already exists in Postgres, the database wins.
  for (const name of listSaveFiles()) {
    if (knownDbKeys.has(name)) continue;
    const payload = readJsonFile(name);
    if (payload == null) continue;
    await pool.query(
      `INSERT INTO ${DB_TABLE}(save_key, payload, updated_at)
       VALUES($1, $2::jsonb, NOW())
       ON CONFLICT(save_key) DO NOTHING`,
      [name, JSON.stringify(payload)]
    );
    knownDbKeys.add(name);
  }

  const lastSynced = new Map();
  for (const name of listSaveFiles()) {
    const payload = readJsonFile(name);
    if (payload != null) lastSynced.set(name, stableJson(payload));
  }

  const pending = new Map();
  let shuttingDown = false;
  let syncingAll = false;

  async function persistFile(name) {
    const safe = safeSaveFileName(name);
    if (!safe) return;
    const payload = readJsonFile(safe);
    if (payload == null) return;
    const serialized = stableJson(payload);
    if (!serialized || lastSynced.get(safe) === serialized) return;
    await pool.query(
      `INSERT INTO ${DB_TABLE}(save_key, payload, updated_at)
       VALUES($1, $2::jsonb, NOW())
       ON CONFLICT(save_key) DO UPDATE
       SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [safe, serialized]
    );
    lastSynced.set(safe, serialized);
  }

  function queuePersist(name) {
    const safe = safeSaveFileName(name);
    if (!safe || shuttingDown) return;
    clearTimeout(pending.get(safe));
    pending.set(safe, setTimeout(() => {
      pending.delete(safe);
      persistFile(safe).catch(err => console.error(`[DB] save ${safe} failed:`, err.message));
    }, 120));
  }

  async function syncAll() {
    if (syncingAll) return;
    syncingAll = true;
    try {
      for (const name of listSaveFiles()) await persistFile(name);
    } finally {
      syncingAll = false;
    }
  }

  let watcher = null;
  try {
    watcher = fs.watch(SAVE_DIR, { persistent: false }, (_event, filename) => {
      if (filename) queuePersist(filename);
    });
  } catch (err) {
    console.warn("[DB] fs.watch unavailable, interval sync remains active:", err.message);
  }

  const syncTimer = setInterval(() => {
    syncAll().catch(err => console.error("[DB] periodic sync failed:", err.message));
  }, DB_SYNC_INTERVAL_MS);
  syncTimer.unref?.();

  pool.on("error", err => console.error("[DB] pool error:", err.message));

  console.log(`[DB] PostgreSQL connected. Restored ${restored.rowCount} save record(s).`);

  const game = require("./server");
  game.startRuntime();

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[DB] ${signal}: flushing player saves...`);
    clearInterval(syncTimer);
    if (watcher) watcher.close();
    for (const timer of pending.values()) clearTimeout(timer);
    pending.clear();
    try { await syncAll(); } catch (err) { console.error("[DB] final sync failed:", err.message); }
    try { game.stopRuntime(); } catch {}
    try { await pool.end(); } catch {}
    process.exit(0);
  }

  process.once("SIGTERM", () => { shutdown("SIGTERM"); });
  process.once("SIGINT", () => { shutdown("SIGINT"); });
}

(async () => {
  try {
    if (!DATABASE_URL) await startWithFileSaves();
    else await startWithPostgres();
  } catch (err) {
    console.error("[DB] startup failed:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
