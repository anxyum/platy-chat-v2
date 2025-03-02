const fs = require("fs");
const path = require("path");

const files = fs
  .readdirSync(__dirname)
  .filter((file) => file !== "index.js" && !file.startsWith("."));

const utils = {};

files.forEach((file) => {
  const name = path.basename(file, ".js");
  utils[name] = require(`./${file}`);
});

module.exports = utils;
