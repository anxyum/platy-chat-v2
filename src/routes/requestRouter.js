const path = require("path");
const fs = require("fs");
const { logger } = require("../utils");
const { PUBLIC_PATH } = require("../config/env");
const {
  handleMessage,
  deleteMessage,
} = require("../controllers/messageController");
const {
  handleLogin,
  handleRegister,
  handleDisconnect,
  handleRefreshToken,
} = require("../controllers/authController");

async function handleRequest(req, res) {
  try {
    switch (req.method) {
      case "GET":
        await handleGetRequest(req, res);
        break;
      case "POST":
        await handlePostRequest(req, res);
        break;
      default:
        logger.warn(`unknown request method: ${req.method}`);
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  } catch (error) {
    logger.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}

function handleGetRequest(req, res) {
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

async function handlePostRequest(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const data = JSON.parse(body);

      switch (req.url) {
        case "/message":
          await handleMessage(data, req, res);
          break;
        case "/delete":
          await deleteMessage(data, req, res);
          break;
        case "/login":
          await handleLogin(data, req, res);
          break;
        case "/register":
          await handleRegister(data, req, res);
          break;
        case "/disconnect":
          await handleDisconnect(data, req, res);
          break;
        case "/refresh":
          await handleRefreshToken(data, req, res);
          break;
        default:
          logger.warn(`unknown request URL: ${req.url}`);
          break;
      }
    } catch (error) {
      logger.error(error);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "JSON invalide" }));
    }
  });
}

module.exports = { handleRequest };
