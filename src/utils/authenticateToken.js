const jwt = require("jsonwebtoken");
const logger = require("./logger");

const { JWT_SECRET_KEY } = require("../config/env");

function authenticateToken(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET_KEY);
  } catch (err) {
    logger.error(err);
    return null;
  }
}

module.exports = authenticateToken;
