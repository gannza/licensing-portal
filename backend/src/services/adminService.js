const { v4: uuidv4 } = require("uuid");
const userRepo = require("../repositories/userRepo");
const auditRepo = require("../repositories/auditRepo");
const { hashPassword, generateTempPassword } = require("../utils/password");
const { ConflictError, NotFoundError } = require("../utils/errors");
const db = require("../db/knex");

async function createStaffUser(
  { email, full_name, phone, workflow_roles },
  admin_id,
) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new ConflictError("Email already registered");

  const tempPassword = generateTempPassword();
  const password_hash = await hashPassword(tempPassword);

  return db.transaction(async (trx) => {
    const user = await trx("users")
      .insert({
        id: uuidv4(),
        email: email.toLowerCase(),
        password_hash,
        full_name,
        phone,
        system_role: "STAFF",
        must_change_password: true,
      })
      .returning("*")
      .then((r) => r[0]);

    if (workflow_roles && workflow_roles.length > 0) {
      const roleRows = workflow_roles.map((wr) => ({
        id: uuidv4(),
        user_id: user.id,
        workflow_id: wr.workflow_id,
        role: wr.role,
        assigned_by: admin_id,
      }));
      await trx("user_workflow_roles")
        .insert(roleRows)
        .onConflict(["user_id", "workflow_id", "role"])
        .ignore();
    }

    await auditRepo.create(
      {
        id: uuidv4(),
        acting_user_id: admin_id,
        action: "USER_CREATED",
        metadata: JSON.stringify({
          created_user_email: email,
          system_role: "STAFF",
        }),
      },
      trx,
    );

    const { password_hash: _ph, ...safeUser } = user;
    return { user: safeUser, temp_password: tempPassword };
  });
}

async function updateUserStatus(user_id, is_active, admin_id) {
  const user = await userRepo.findById(user_id);
  if (!user) throw new NotFoundError("User");

  const updated = await userRepo.updateStatus(user_id, is_active);
  await auditRepo.create({
    id: uuidv4(),
    acting_user_id: admin_id,
    action: is_active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    metadata: JSON.stringify({ target_user_id: user_id }),
  });

  const { password_hash: _ph, ...safe } = updated;
  return safe;
}

async function listUsers(page = 1, limit = 20) {
  const result = await userRepo.findAll({ page, limit });
  return {
    data: result.rows.map(({ password_hash, ...u }) => u),
    pagination: { page, limit, total: result.total },
  };
}

async function getUserWorkflowRoles(user_id) {
  const user = await userRepo.getUserWorkflowRoles(user_id);
   if (!user) throw new NotFoundError('User');
    return user;
}


module.exports = { createStaffUser, updateUserStatus, listUsers, getUserWorkflowRoles };
