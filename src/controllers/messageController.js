const logger = require("../utils/logger");
const db = require("../config/database");
const authenticateToken = require("../utils/authenticateToken");

function handleMessage(data, req, res) {
  logger.info(`handling message`);

  const user = authenticateToken(req);
  if (!user) {
    logger.warn("Accès refusé, token invalide");
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Accès refusé, token invalide" }));
    return;
  }

  db.run(
    "INSERT INTO messages (content, author_id, channel_id) VALUES (?, ?, ?)",
    [data.message, user.user_id, data.channel_id],
    function (err) {
      if (err) {
        logger.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Erreur lors de l'enregistrement du message",
          })
        );
      } else {
        logger.info("Message enregistré avec succès !");
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ response: "Message envoyé !", id: this.lastID })
        );
      }
    }
  );
}

module.exports = { handleMessage };
