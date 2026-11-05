require('dotenv').config();

const { pool, query } = require('../db');

async function promoteAdmin(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Provide the email address of an existing account');
  }

  const result = await query(
    `UPDATE users SET role = 'admin', updated_at = now()
     WHERE email = $1
     RETURNING id, display_name, email, role`,
    [email.trim().toLowerCase()],
  );
  if (!result.rows[0]) {
    throw new Error('No account exists for that email address');
  }
  console.log(`Administrator role granted to ${result.rows[0].email}`);
}

promoteAdmin(process.argv[2])
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
