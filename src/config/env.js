require("dotenv").config();
const path = require("path");

const JWT_SECRET_KEY = process.env.JWT_SECRET;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);
const PORT = process.env.PORT;
const DB_PATH = path.join(__dirname, "../../", process.env.DB_PATH);
const NODE_ENV = process.env.NODE_ENV;
const PUBLIC_PATH = path.join(__dirname, "../../public");

module.exports = {
  JWT_SECRET_KEY,
  SALT_ROUNDS,
  PORT,
  DB_PATH,
  NODE_ENV,
  PUBLIC_PATH,
};
