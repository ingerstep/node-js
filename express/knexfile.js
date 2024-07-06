import { configDotenv } from "dotenv";
configDotenv()

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export const client = "pg";
export const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};
export const migrations = {
  tableName: "knex_migrations",
};
