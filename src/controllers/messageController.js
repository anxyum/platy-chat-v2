const db = require("../config/database");
const { logger, authenticateToken } = require("../utils");

const ERROR_MESSAGES = {
  INVALID_TOKEN: "Invalid token",
  INTERNAL_SERVER_ERROR: "Internal server error",
  MESSAGE_NOT_FOUND: "Message not found",
  ACCESS_DENIED: "Access denied",
  MESSAGE_DELETED: "Message deleted",
};

async function handleMessage(data, req, res) {
  const user = authenticateToken(req);
  if (!user) {
    logger.warn(ERROR_MESSAGES.INVALID_TOKEN);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }));
    return;
  }

  const channel = await db.get("SELECT * FROM channels WHERE id = ?", [
    data.channel_id,
  ]);

  if (!channel) {
    logger.warn(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: ERROR_MESSAGES.CHANNEL_NOT_FOUND }));
    return;
  }

  const member = await db.get(
    "SELECT * FROM guild_users WHERE guild_id = ? AND user_id = ?",
    [channel.guild_id, user.user_id]
  );

  if (!channel.public && !member) {
    logger.warn(ERROR_MESSAGES.ACCESS_DENIED);
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: ERROR_MESSAGES.ACCESS_DENIED,
      })
    );
    return;
  }

  await db.run(
    "INSERT INTO messages (content, author_id, channel_id) VALUES (?, ?, ?)",
    [data.message, user.user_id, data.channel_id]
  );
}

async function deleteMessage(data, req, res) {
  const user = authenticateToken(req);
  if (!user) {
    logger.warn(ERROR_MESSAGES.INVALID_TOKEN);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }));
    return;
  }

  const message = await db.get("SELECT * FROM messages WHERE id = ?", [
    data.message_id,
  ]);

  if (!message) {
    logger.warn(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: ERROR_MESSAGES.MESSAGE_NOT_FOUND }));
    return;
  }

  if (message.author_id !== user.user_id) {
    logger.warn(ERROR_MESSAGES.ACCESS_DENIED);
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: ERROR_MESSAGES.ACCESS_DENIED,
      })
    );
    return;
  }

  await db.run("UPDATE messages SET deleted = 1 WHERE id = ?", [
    data.message_id,
  ]);
}

module.exports = { handleMessage, deleteMessage };
