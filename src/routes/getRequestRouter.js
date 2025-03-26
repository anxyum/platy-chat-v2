const { logger } = require("../utils");
const path = require("path");
const { parse } = require("url");
const fs = require("fs");
const { PUBLIC_PATH } = require("../config/env");
const db = require("../config/database");
const { authenticateToken } = require("../utils");

const routes = {
  guilds,
  users,
};

async function guilds(path, req, res) {
  const user = authenticateToken(req);

  if (!user) {
    logger.warn("Invalid token");
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid token" }));
    return;
  }

  if (path.length === 0) {
    let guilds = await db.all("SELECT * FROM guild_users WHERE user_id = ?", [
      user.user_id,
    ]);
    guilds = guilds.map((guild) => guild.guild_id);
    const placeholders = guilds.map(() => "?").join(",");
    guilds = await db.all(
      `SELECT * FROM guilds WHERE id IN (${placeholders})`,
      guilds
    );
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ guilds }));
    return;
  } else if (path.length === 1) {
    if (path[0] === "@me") {
      logger.info("not implemented");
      res.writeHead(501, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not implemented" }));
      return;
    }

    const guildId = parseInt(path[0]);
    if (isNaN(guildId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid guild ID" }));
      return;
    }

    const guild = await db.get("SELECT * FROM guilds WHERE id = ?", [guildId]);
    if (!guild) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Guild not found" }));
      return;
    }

    const member = await db.get(
      "SELECT * FROM guild_users WHERE guild_id = ? AND user_id = ?",
      [guildId, user.user_id]
    );

    if (!member) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Access denied" }));
      return;
    }

    const members = await db.all(
      "SELECT * FROM guild_users WHERE guild_id = ?",
      [guildId]
    );

    const channels = await db.all("SELECT * FROM channels WHERE guild_id = ?", [
      guildId,
    ]);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ...guild, members, channels }));
    return;
  } else if (path.length === 2) {
    if (path[0] === "@me") {
      logger.info("not implemented");
      res.writeHead(501, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not implemented" }));
      return;
    }

    const guildId = parseInt(path[0]);
    const channelId = parseInt(path[1]);

    if (isNaN(guildId) || isNaN(channelId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid guild or channel ID" }));
      return;
    }

    const guild = await db.get("SELECT * FROM guilds WHERE id = ?", [guildId]);

    if (!guild) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Guild not found" }));
      return;
    }

    const member = await db.get(
      "SELECT * FROM guild_users WHERE guild_id = ? AND user_id = ?",
      [guildId, user.user_id]
    );

    if (!member) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Access denied" }));
      return;
    }

    const channel = await db.get(
      "SELECT * FROM channels WHERE guild_id = ? AND id = ?",
      [guildId, channelId]
    );

    if (!channel) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Channel not found" }));
      return;
    }

    const messages = await db.all(
      "SELECT * FROM messages WHERE channel_id = ?",
      [channelId]
    );

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ...channel, messages }));
    return;
  }
}

async function users(path, req, res) {
  const currentUser = authenticateToken(req);

  if (!currentUser) {
    logger.warn("Invalid token");
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid token" }));
    return;
  }

  if (path.length === 0) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid request" }));
    return;
  } else if (path.length === 1) {
    const userId = parseInt(path[0]);
    if (isNaN(userId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid user ID" }));
      return;
    }

    const user = await db.get("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "User not found" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ...user }));
    return;
  }
}

async function handleGetRequest(req, res) {
  const { pathname } = parse(req.url, true);
  const requestPath = pathname.split("/").filter((p) => p !== "");

  if (requestPath[0] === "api") {
    const route = routes[requestPath[1]];
    if (route) {
      await route(requestPath.slice(2), req, res);
    } else {
      logger.warn(`route not found: ${pathname}`);
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    }
    return;
  }

  const filePath = path.join(
    PUBLIC_PATH,
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
      logger.warn(`file not found: ${filePath}`);
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

module.exports = handleGetRequest;
