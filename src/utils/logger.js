const bunyan = require("bunyan");
const logger = bunyan.createLogger({
  name: "platy-chat",
  streams: [
    {
      level: "info",
      path: "./logs/combined.log",
    },
    {
      level: "error",
      path: "./logs/error.log",
    },
  ],
});

module.exports = logger;
