const { v4: uuidv4 } = require("uuid");
const { pool } = require("../db/pool");

function logAudit(actorId, action, targetType, targetId, metadata) {
  return pool.execute(
    `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), actorId || null, action, targetType || null, targetId || null, metadata ? JSON.stringify(metadata) : null]
  );
}

module.exports = { logAudit };
