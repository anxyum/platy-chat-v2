const bunyan = require("bunyan");
const { parse } = require("dotenv");

const colors = {
  INFO: "\x1b[32m", // Vert
  WARN: "\x1b[33m", // Jaune
  ERROR: "\x1b[31m", // Rouge
  RESET: "\x1b[0m", // Reset la couleur
};

const consoleStream = {
  level: "info",
  stream: {
    write: function (rec) {
      const logObject = JSON.parse(rec);
      const levelName = bunyan.nameFromLevel[logObject.level].toUpperCase();
      const color = colors[levelName] || colors.RESET;
      console.log(`${color}${levelName}: ${colors.RESET}${logObject.msg}`);
    },
  },
};

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
    consoleStream,
  ],
});

module.exports = logger;
