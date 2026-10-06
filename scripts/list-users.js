const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const users = await p.user.findMany({
    select: { id: true, name: true, role: true, email: true, phone: true, status: true },
  });
  console.log(JSON.stringify(users, null, 2));
  console.log("Total users:", users.length);
  await p.$disconnect();
})();
