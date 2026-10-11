import { neon } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_c54yYUWuxFAX@ep-icy-king-azkr5i9q.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(databaseUrl);
