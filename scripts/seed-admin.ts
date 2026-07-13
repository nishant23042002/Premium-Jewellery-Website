/**
 * One-off script to provision the first admin account. There is no public
 * sign-up flow for /admin by design (PRD §34/§35) — accounts are created by
 * whoever holds deploy access, not through the app itself.
 *
 * Usage: npm run seed:admin -- --email owner@example.com --password "..." --name "Owner" --role owner
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { connectToDatabase } from "../lib/db/mongoose";
import { hashPassword } from "../lib/auth/password";
import { AdminUserModel } from "../features/auth/admin-user.model";
import { DEFAULT_TENANT_ID } from "../lib/db/schema-helpers";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const email = get("--email");
  const password = get("--password");
  const name = get("--name") ?? "Store Owner";
  const role = (get("--role") ?? "owner") as "owner" | "staff";

  if (!email || !password) {
    console.error(
      "Usage: npm run seed:admin -- --email <email> --password <password> [--name <name>] [--role owner|staff]",
    );
    process.exit(1);
  }

  return { email, password, name, role };
}

async function main() {
  const { email, password, name, role } = parseArgs();

  await connectToDatabase();

  const existing = await AdminUserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`Admin user with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const admin = await AdminUserModel.create({
    tenantId: DEFAULT_TENANT_ID,
    email: email.toLowerCase(),
    name,
    passwordHash,
    role,
  });

  console.log(`Created admin user: ${admin.email} (${admin.role})`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
