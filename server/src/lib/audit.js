const { v4: uuidv4 } = require("uuid");
const { pool } = require("../db/pool");

function logAudit(actorId, action, targetType, targetId, metadata) {
  return pool.query(
    `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), actorId || null, action, targetType || null, targetId || null, metadata ? JSON.stringify(metadata) : null]
  );
}

module.exports = { logAudit };
