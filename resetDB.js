const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const db = new sqlite3.Database("./DB/db.db", (err) => {
  if (err) {
    console.error("Erreur lors de l'ouverture de la DB", err.message);
    return;
  }
  console.log("Base de données connectée.");

  db.serialize(() => {
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
        password TEXT NOT NULL
      )`,

      `CREATE TABLE messages (
        deleted BOOLEAN DEFAULT 0,
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

    queries.forEach((query) => {
      db.run(query, (err) => {
        if (err) {
          console.error("Erreur SQL :", err.message);
        } else {
          console.log("Requête exécutée avec succès :", query.split("\n")[0]);
        }
      });
    });

    bcrypt.hash("adminpassword", SALT_ROUNDS, (err, hash) => {
      if (err) {
        console.error("Erreur de hachage:", err.message);
        return;
      }

      db.run(
        `INSERT INTO users (username, displayname, password) VALUES (?, ?, ?)`,
        ["admin", "Admin", hash],
        function (err) {
          if (err) {
            console.error("Erreur ajout admin:", err.message);
            return;
          }
          console.log("Admin ajouté avec ID:", this.lastID);

          db.run(
            `INSERT INTO guilds (displayname, creator_id) VALUES (?, ?)`,
            ["Guilde Test", this.lastID],
            function (err) {
              if (err) {
                console.error("Erreur ajout guilde:", err.message);
                return;
              }
              console.log("Guilde Test ajoutée");

              db.run(
                `INSERT INTO channels (name, public, guild_id) VALUES (?, ?, ?)`,
                ["général", 1, this.lastID],
                function (err) {
                  if (err) {
                    console.error("Erreur ajout channel:", err.message);
                    return;
                  }
                  console.log("Channel 'général' ajouté");
                  db.close((err) => {
                    if (err) {
                      console.error(
                        "Erreur lors de la fermeture de la DB",
                        err.message
                      );
                      return;
                    }
                    console.log("Base de données fermée.");
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});
