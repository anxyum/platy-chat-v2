const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const logger = require("../utils/logger");
const db = require("../config/database");

const { JWT_SECRET_KEY, SALT_ROUNDS } = require("../config/env");

function handleRegister(data, req, res) {
  logger.info(`handling register`);
  const { username, password } = data;

  if (username.length < 3) {
    logger.warn("username too short");
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Nom d'utilisateur trop court" }));
    return;
  }

  if (password.length < 8) {
    logger.warn("password too short");
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Mot de passe trop court" }));
    return;
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (user) {
      logger.warn("username already taken");
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Nom d'utilisateur déjà pris" }));
      return;
    }
    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (err) {
        logger.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Erreur lors du hachage du mot de passe",
          })
        );
        return;
      }

      db.run(
        "INSERT INTO users (username, displayname, password) VALUES (?, ?, ?)",
        [username, username, hash],
        (err) => {
          if (err) {
            logger.error(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Erreur lors de l'enregistrement de l'utilisateur",
              })
            );
            return;
          }
          logger.info("New user registered", { username });
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ response: "Utilisateur enregistré !" }));
        }
      );
    });
  });
}

function handleLogin(data, req, res) {
  logger.info(`handling login`);
  const { username, password } = data;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user) {
      logger.warn("User not found");
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Utilisateur non trouvé" }));
      return;
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        // Générer un token JWT
        const token = jwt.sign({ user_id: user.id }, JWT_SECRET_KEY, {
          expiresIn: "1h",
        });

        logger.info("User logged in", { username });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ response: "Connexion réussie", token }));
      } else {
        logger.warn("Incorrect password");
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Mot de passe incorrect" }));
      }
    });
  });
}

module.exports = { handleLogin, handleRegister };
