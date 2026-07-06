const { verifyToken } = require("../lib/jwt");
const { pool } = require("../db/pool");
const { ApiError, asyncHandler } = require("../lib/apiError");

// Reads the JWT from the httpOnly cookie, verifies it, and loads the current
// user row from the DB (so role/status changes take effect without
// re-login). Attaches the raw DB row as req.user (snake_case columns) —
// routes convert to the public camelCase shape with lib/mappers.js.
const requireUser = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.token;
  const payload = token ? verifyToken(token) : null;
  if (!payload) throw new ApiError("Not authenticated", 401);

  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [payload.id]);
  const user = rows[0];
  if (!user || user.status === "suspended") throw new ApiError("Not authenticated", 401);

  req.user = user;
  next();
});

const requireAdmin = [
  requireUser,
  (req, _res, next) => {
    if (req.user.role !== "ADMIN") {
      return next(new ApiError("Admin access required", 403));
    }
    next();
  },
];

module.exports = { requireUser, requireAdmin };
