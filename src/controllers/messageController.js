const db = require("../config/database");
const { logger, authenticateToken } = require("../utils");

const ERROR_MESSAGES = {
  INVALID_TOKEN: "Invalid token",
  INTERNAL_SERVER_ERROR: "Internal server error",
  MESSAGE_NOT_FOUND: "Message not found",
  ACCESS_DENIED: "Access denied",
  MESSAGE_DELETED: "Message deleted",
  CHANNEL_NOT_FOUND: "Channel not found",
};

async function handleMessage(data, req, res) {
  const decodedToken = authenticateToken(req);
  if (!decodedToken) {
    logger.warn(ERROR_MESSAGES.INVALID_TOKEN);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }));
    return;
  }
  const userId = decodedToken.user_id;

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
    [channel.guild_id, userId]
  );

  const user = await db.get("SELECT * FROM users WHERE id = ?", [userId]);

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
    [data.content, userId, data.channel_id]
  );

  const message = await db.get(
    "SELECT * FROM messages WHERE id = (SELECT MAX(id) FROM messages WHERE channel_id = ? AND author_id = ?)",
    [data.channel_id, userId]
  );

  logger.info(
    `Message sent by "${user.username}" in channel "${channel.name}"`
  );

  res.writeHead(201, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      message,
      response: "Message sent successfully",
    })
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

  await db.run("DELETE FROM messages WHERE id = ?", [data.message_id]);
}

module.exports = { handleMessage, deleteMessage };
