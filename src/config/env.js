require("dotenv").config();
const path = require("path");

const JWT_SECRET_KEY = process.env.JWT_SECRET || "secret";
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET || "refresh";
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const PORT = 3000;
const DB_PATH = path.join(__dirname, "../../DB/db.db");
const NODE_ENV = process.env.NODE_ENV || "development";
const PUBLIC_PATH = path.join(__dirname, "../../public");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpassword";

module.exports = {
  JWT_SECRET_KEY,
  REFRESH_SECRET_KEY,
  SALT_ROUNDS,
  PORT,
  DB_PATH,
  NODE_ENV,
  PUBLIC_PATH,
  ADMIN_PASSWORD,
};
