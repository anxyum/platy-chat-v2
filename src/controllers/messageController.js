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

  db.get(
    "SELECT * FROM channels WHERE id = ?",
    [data.channel_id],
    (err, channel) => {
      if (err) {
        logger.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Erreur lors de la récupération du channel",
          })
        );
        return;
      }

      if (!channel) {
        logger.warn("Channel non trouvé");
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Channel non trouvé" }));
        return;
      }

      db.get(
        "SELECT * FROM guild_users WHERE guild_id = ? AND user_id = ?",
        [channel.guild_id, user.user_id],
        (err, member) => {
          if (err) {
            logger.error(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error:
                  "Erreur lors de la vérification de l'appartenance à la guild",
              })
            );
            return;
          }

          if (!channel.public && !member) {
            logger.warn("Channel privé et utilisateur non membre de la guild");
            res.writeHead(403, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error:
                  "Ce channel est privé et vous n'êtes pas membre de la guild",
              })
            );
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
                return;
              }

              logger.info("Message enregistré avec succès !");
              res.writeHead(201, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  response: "Message envoyé !",
                  id: this.lastID,
                })
              );
            }
          );
        }
      );
    }
  );
}

function deleteMessage(data, req, res) {
  logger.info(`deleting message`);

  const user = authenticateToken(req);
  if (!user) {
    logger.warn("Accès refusé, token invalide");
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Accès refusé, token invalide" }));
    return;
  }

  db.get(
    "SELECT * FROM messages WHERE id = ?",
    [data.message_id],
    (err, message) => {
      if (err) {
        logger.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Erreur lors de la récupération du message",
          })
        );
        return;
      }

      if (!message) {
        logger.warn("Message non trouvé");
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Message non trouvé" }));
        return;
      }

      if (message.author_id !== user.user_id) {
        logger.warn("Accès refusé, vous n'êtes pas l'auteur du message");
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Accès refusé, vous n'êtes pas l'auteur du message",
          })
        );
        return;
      }

      db.run(
        "UPDATE messages SET deleted = 1 WHERE id = ?",
        [data.message_id],
        (err) => {
          if (err) {
            logger.error(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Erreur lors de la suppression du message",
              })
            );
            return;
          }
        }
      );
    }
  );
}

module.exports = { handleMessage, deleteMessage };
