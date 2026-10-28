import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // This will use your .env file, or fall back to default postgres credentials
    url: process.env.DATABASE_URL || "postgresql://postgres:Moatasim18%newer@localhost:5432/erp_db?schema=public",
  },
});