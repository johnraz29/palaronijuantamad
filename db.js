const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const dbFile = path.join(__dirname, 'data.sqlite');
const db = new Database('data.sqlite');

function initDb() {
  db.serialize(() => {
    // 1. USERS TABLE
    db.run(`CREATE TABLE IF NOT EXISTS users (
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
    db.run("ALTER TABLE users ADD COLUMN phone TEXT", (err) => {});
    db.run("ALTER TABLE users ADD COLUMN gcash_number TEXT", (err) => {});
    db.run("ALTER TABLE users ADD COLUMN bank_account TEXT", (err) => {});
    db.run("ALTER TABLE users ADD COLUMN name_change_count INTEGER DEFAULT 0", (err) => {});

    // 3. BETS TABLE (Inayos para sa iba't ibang games)
    db.run(`CREATE TABLE IF NOT EXISTS bets (
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

    // Migrations for Bets (Importante para sa House Ledger)
    db.run("ALTER TABLE bets ADD COLUMN game_type TEXT", (err) => {});
    db.run("ALTER TABLE bets ADD COLUMN payout REAL DEFAULT 0", (err) => {});

    // 4. TRANSACTIONS
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      type TEXT,
      amount REAL,
      status TEXT,
      reference TEXT,
      created_at TEXT
    )`);

    // 5. RESULTS
    db.run(`CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      numbers TEXT,
      created_at TEXT
    )`);

    // 6. SETTINGS
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);

    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('live_stream_url', 'https://www.youtube.com/embed/live_stream_id')");
    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('video_status', 'playing')");

    // 7. AUTO CREATE ADMIN
    db.get('SELECT id FROM users WHERE email=?', ['admin@lotto.com'], async (err, row) => {
      if (!row) {
        const hash = await bcrypt.hash('admin123', 10);
        db.run('INSERT INTO users (name, email, phone, password_hash, is_admin) VALUES (?, ?, ?, ?, 1)',
          ['Super Admin', 'admin@lotto.com', '00000000000', hash]);
      }
    });

    // 8. AUTO CREATE CONTROLLER
    db.get('SELECT id FROM users WHERE email=?', ['controller@lotto.com'], async (err, row) => {
      if (!row) {
        const hash = await bcrypt.hash('123456', 10);
        db.run('INSERT INTO users (name, email, phone, password_hash, is_controller) VALUES (?, ?, ?, ?, 1)',
          ['Controller', 'controller@lotto.com', '11111111111', hash]);
      }
    });
  });
}

module.exports = { initDb, db };