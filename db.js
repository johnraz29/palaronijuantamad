const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const dbFile = path.resolve(process.cwd(), 'data.sqlite');
const db = new Database(dbFile);

function initDb() {
    // 1. USERS TABLE
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT,
      balance REAL DEFAULT 0,
      gcash_number TEXT,
      bank_account TEXT,
      name_change_count INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      is_controller INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migrations for Users
    try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT"); } catch (e) {}
    try { db.exec("ALTER TABLE users ADD COLUMN gcash_number TEXT"); } catch (e) {}
    try { db.exec("ALTER TABLE users ADD COLUMN bank_account TEXT"); } catch (e) {}
    try { db.exec("ALTER TABLE users ADD COLUMN name_change_count INTEGER DEFAULT 0"); } catch (e) {}

    // 3. BETS TABLE
    db.exec(`CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      numbers TEXT,
      amount REAL,
      choice TEXT,
      game_type TEXT,
      payout REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT
    )`);

    try { db.exec("ALTER TABLE bets ADD COLUMN game_type TEXT"); } catch (e) {}
    try { db.exec("ALTER TABLE bets ADD COLUMN payout REAL DEFAULT 0"); } catch (e) {}

    // 4. TRANSACTIONS
    db.exec(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      type TEXT,
      amount REAL,
      status TEXT,
      reference TEXT,
      created_at TEXT
    )`);

    // 5. RESULTS
    db.exec(`CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      numbers TEXT,
      created_at TEXT
    )`);

    // 6. SETTINGS
    db.exec(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);

    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('live_stream_url', 'https://www.youtube.com/embed/live_stream_id')").run();
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('video_status', 'playing')").run();

    // 7. AUTO CREATE ADMIN
    const admin = db.prepare('SELECT id FROM users WHERE email=?').get('admin@lotto.com');
    if (!admin) {
        const hash = bcrypt.hashSync('admin123', 10);
        db.prepare('INSERT INTO users (name, email, phone, password_hash, is_admin) VALUES (?, ?, ?, ?, 1)')
          .run('Super Admin', 'admin@lotto.com', '00000000000', hash);
    }

    // 8. AUTO CREATE CONTROLLER
    const controller = db.prepare('SELECT id FROM users WHERE email=?').get('controller@lotto.com');
    if (!controller) {
        const hash = bcrypt.hashSync('123456', 10);
        db.prepare('INSERT INTO users (name, email, phone, password_hash, is_controller) VALUES (?, ?, ?, ?, 1)')
          .run('Controller', 'controller@lotto.com', '11111111111', hash);
    }
}

module.exports = { initDb, db };