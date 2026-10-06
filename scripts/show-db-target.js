// Prints the DB host/name from .env with credentials masked (safe to share).
const fs = require("fs");
for (const f of [".env", ".env.local", ".env.production"]) {
  if (!fs.existsSync(f)) continue;
  const lines = fs
    .readFileSync(f, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^(DATABASE_URL|DIRECT_URL)\s*=/.test(l))
    .map((l) => l.replace(/\/\/([^:]+):[^@]+@/, "//$1:***@"));
  console.log(f, lines);
}
