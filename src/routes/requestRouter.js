const { logger } = require("../utils");
const handleGetRequest = require("./getRequestRouter");
const handlePostRequest = require("./postRequestRouter");

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

module.exports = { handleRequest };
