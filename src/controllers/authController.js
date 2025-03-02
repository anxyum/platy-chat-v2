const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { logger } = require("../utils");
const {
  JWT_SECRET_KEY,
  REFRESH_SECRET_KEY,
  SALT_ROUNDS,
} = require("../config/env");

const ERROR_MESSAGES = {
  USERNAME_INVALID: "Invalid username format",
  PASSWORD_INVALID: "Invalid password format",
  USERNAME_TAKEN: "username already taken",
  USER_NOT_FOUND: "User not found",
  WRONG_PASSWORD: "Wrong password",
  INTERNAL_SERVER_ERROR: "Internal server error",
  INVALID_TOKEN: "Invalid token",
};

const INFO_MESSAGES = {
  REGISTER_SUCCESS: "User registered successfully",
  LOGIN_SUCCESS: "User logged in successfully",
};

function validateInput(username, password) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  const isValidUsername = usernameRegex.test(username);
  const isValidPassword = passwordRegex.test(password);

  return {
    isValid: isValidUsername && isValidPassword,
    message: !(isValidUsername && isValidPassword)
      ? isValidUsername
        ? ERROR_MESSAGES.PASSWORD_INVALID
        : ERROR_MESSAGES.USERNAME_INVALID
      : "",
  };
}

function generateTokens(user) {
  const accessToken = jwt.sign({ user_id: user.id }, JWT_SECRET_KEY, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ user_id: user.id }, REFRESH_SECRET_KEY, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
}

async function handleRegister(data, req, res) {
  try {
    const { username, password } = data;
    const { isValid, message } = validateInput(username, password);

    if (!isValid) {
      logger.warn(message);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: message }));
      return;
    }

    const existingUser = await db.get(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUser) {
      logger.warn(ERROR_MESSAGES.USERNAME_TAKEN);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: ERROR_MESSAGES.USERNAME_TAKEN }));
      return;
    }

    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    await db.run(
      "INSERT INTO users (username, displayname, password) VALUES (?, ?, ?)",
      [username, username, hash]
    );

    logger.info(INFO_MESSAGES.REGISTER_SUCCESS, { username });
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ response: INFO_MESSAGES.REGISTER_SUCCESS }));
  } catch (error) {
    logger.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }));
  }
}

async function handleLogin(data, req, res) {
  try {
    const { username, password } = data;
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: ERROR_MESSAGES.USER_NOT_FOUND }));
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: ERROR_MESSAGES.WRONG_PASSWORD }));
      return;
    }

    const tokens = generateTokens(user);

    await db.run("UPDATE users SET refresh_token = ? WHERE id = ?", [
      tokens.refreshToken,
      user.id,
    ]);

    logger.info("User logged in", { username });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        response: INFO_MESSAGES.LOGIN_SUCCESS,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      })
    );
  } catch (error) {
    logger.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }));
  }
}

async function handleDisconnect(data, req, res) {
  try {
    const { refreshToken } = data;

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);

    const user = await db.get(
      "SELECT * FROM users WHERE id = ? AND refresh_token = ?",
      [decoded.user_id, refreshToken]
    );

    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }));
      return;
    }

    await db.run("UPDATE users SET refresh_token = ? WHERE id = ?", [
      null,
      user.id,
    ]);

    logger.info("User disconnected", { username: user.username });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        response: "User disconnected successfully",
      })
    );
  } catch (error) {
    logger.error(error);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }));
  }
}

async function handleRefreshToken(data, req, res) {
  try {
    const { refreshToken } = data;

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);

    const user = await db.get(
      "SELECT * FROM users WHERE id = ? AND refresh_token = ?",
      [decoded.user_id, refreshToken]
    );

    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }));
      return;
    }

    const tokens = generateTokens(user);

    await db.run("UPDATE users SET refresh_token = ? WHERE id = ?", [
      tokens.refreshToken,
      user.id,
    ]);

    logger.info("Token refreshed", { username: user.username });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      })
    );
  } catch (error) {
    logger.error(error);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }));
  }
}

module.exports = {
  handleLogin,
  handleRegister,
  handleRefreshToken,
  handleDisconnect,
};
