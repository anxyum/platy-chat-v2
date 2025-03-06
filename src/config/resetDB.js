const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const { DB_PATH, SALT_ROUNDS, ADMIN_PASSWORD } = require("./env");
const fs = require("fs");
const path = require("path");

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = require("./database");

const queries = [
  `DROP TABLE IF EXISTS messages`,
  `DROP TABLE IF EXISTS users`,
  `DROP TABLE IF EXISTS channels`,
  `DROP TABLE IF EXISTS channel_users`,
  `DROP TABLE IF EXISTS guilds`,
  `DROP TABLE IF EXISTS guild_users`,

  `CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    displayname TEXT NOT NULL,
    password TEXT NOT NULL,
    refresh_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER,
    channel_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE guilds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER,
    displayname TEXT NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE guild_users (
    guild_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (guild_id, user_id),
    FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    public BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE
  )`,
];

const runQueries = async () => {
  for (const query of queries) {
    console.log("Executing query:", query.split("\n")[0]);
    await db.run(query);
  }
};

async function main() {
  await runQueries();

  const hash = bcrypt.hashSync(ADMIN_PASSWORD, SALT_ROUNDS);

  const user = await db.run(
    `INSERT INTO users (username, displayname, password) VALUES (?, ?, ?)`,
    ["admin", "Admin", hash]
  );
  console.log("Admin ajouté avec ID:", user.lastID);

  const guild = await db.run(
    `INSERT INTO guilds (displayname, creator_id) VALUES (?, ?)`,
    ["Guilde Test", user.lastID]
  );
  console.log("Guilde Test ajoutée avec ID:", guild.lastID);

  const channel = await db.run(
    `INSERT INTO channels (name, public, guild_id) VALUES (?, ?, ?)`,
    ["général", 1, guild.lastID]
  );
  console.log("Channel 'général' ajouté avec ID:", channel.lastID);

  await db.run(
    `INSERT INTO guild_users (guild_id, user_id) VALUES (?, ?)`,
    [guild.lastID, user.lastID]
  );
}

main();
