const http = require("http");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET || "secretkeyverysecret";
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const DB_PATH = process.env.DB_PATH || "./DB/db.db";
const PORT = process.env.PORT || PORT;

const db = new sqlite3.Database(DB_PATH);
const publicPath = path.join(__dirname, "public");

const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite par IP
});

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

server.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});

function handleRequest(req, res) {
  switch (req.method) {
    case "GET":
      handleGetRequest(req, res);
      break;
    case "POST":
      handlePostRequest(req, res);
      break;
  }
}

function handleGetRequest(req, res) {
  const filePath = path.join(
    publicPath,
    req.url === "/" ? "index.html" : req.url
  );

  const extname = path.extname(filePath);
  let contentType = "text/html";

  if (extname === ".js") {
    contentType = "application/javascript";
  } else if (extname === ".css") {
    contentType = "text/css";
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

function handlePostRequest(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      const data = JSON.parse(body);

      switch (req.url) {
        case "/message":
          handleMessage(data, req, res);
          break;
        case "/login":
          handleLogin(data, req, res);
          break;
        case "/register":
          handleRegister(data, req, res);
          break;
        default:
          console.log(req.url);
          break;
      }
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "JSON invalide" }));
    }
  });
}

function handleMessage(data, req, res) {
  console.log("handling message");
  console.log(data);

  const user = authenticateToken(req);
  if (!user) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Accès refusé, token invalide" }));
    return;
  }

  db.run(
    "INSERT INTO messages (content, author_id, channel_id) VALUES (?, ?, ?)",
    [data.message, user.user_id, data.channel_id],
    function (err) {
      if (err) {
        console.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Erreur lors de l'enregistrement du message",
          })
        );
      } else {
        console.log("Message enregistré avec succès !");
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ response: "Message envoyé !", id: this.lastID })
        );
      }
    }
  );
}

function handleRegister(data, req, res) {
  console.log("handling register");
  console.log(data);
  const { username, password } = data;

  if (username.length < 3) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Nom d'utilisateur trop court" }));
    return;
  }

  if (password.length < 8) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Mot de passe trop court" }));
    return;
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (user) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Nom d'utilisateur déjà pris" }));
      return;
    }
    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (err) {
        console.error(err);
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
            console.error(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Erreur lors de l'enregistrement de l'utilisateur",
              })
            );
            return;
          }
          console.log("Utilisateur enregistré avec succès !");
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ response: "Utilisateur enregistré !" }));
        }
      );
    });
  });
}

function handleLogin(data, req, res) {
  console.log("handling login");
  const { username, password } = data;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Utilisateur non trouvé" }));
      return;
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        // Générer un token JWT
        const token = jwt.sign({ user_id: user.id }, SECRET_KEY, {
          expiresIn: "1h",
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ response: "Connexion réussie", token }));
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Mot de passe incorrect" }));
      }
    });
  });
}

function authenticateToken(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    console.error(err);
    return null;
  }
}
