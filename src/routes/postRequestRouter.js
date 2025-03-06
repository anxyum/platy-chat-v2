const { parse } = require("url");
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

const routes = {
  "/api/message/send": handleMessage,
  "/api/message/delete": deleteMessage,
  "/api/auth/login": handleLogin,
  "/api/auth/register": handleRegister,
  "/api/auth/disconnect": handleDisconnect,
  "/api/auth/refresh": handleRefreshToken,
};

async function handlePostRequest(req, res) {
  const { pathname } = parse(req.url, true);

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const data = JSON.parse(body);
      await routes[pathname](data, req, res);
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
    }

    // switch (req.url) {
    //   case "/api/message/send":
    //     await handleMessage(data, req, res);
    //     break;
    //   case "/api/message/delete":
    //     await deleteMessage(data, req, res);
    //     break;
    //   case "/api/login":
    //     await handleLogin(data, req, res);
    //     break;
    //   case "/api/register":
    //     await handleRegister(data, req, res);
    //     break;
    //   case "/api/disconnect":
    //     await handleDisconnect(data, req, res);
    //     break;
    //   case "/api/refresh":
    //     await handleRefreshToken(data, req, res);
    //     break;
    //   default:
    //     logger.warn(`unknown request URL: ${req.url}`);
    //     break;
    // }
  });
}

module.exports = handlePostRequest;
