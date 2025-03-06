const { logger } = require("../utils");
const path = require("path");
const fs = require("fs");
const { PUBLIC_PATH } = require("../config/env");

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

module.exports = handleGetRequest;
