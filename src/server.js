const http = require("http");
const logger = require("./utils/logger");

const { handleRequest } = require("./routes/requestRouter");

const { PORT } = require("./config/env");

const server = http.createServer(async (req, res) => {
  await handleRequest(req, res);
});

server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
