const path = require("path");
const fs = require("fs");

const { handleMessage } = require("../controllers/messageController");
const {
  handleLogin,
  handleRegister,
} = require("../controllers/authController");
const logger = require("../utils/logger");
const { PUBLIC_PATH } = require("../config/env");

function handleRequest(req, res) {
  try {
    switch (req.method) {
      case "GET":
        handleGetRequest(req, res);
        break;
      case "POST":
        handlePostRequest(req, res);
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
