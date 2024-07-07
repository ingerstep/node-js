/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("timers", (table) => {
    table.increments("id");
    table.dateTime("start", { precision: 6 });
    table.dateTime("end", { precision: 6 });
    table.boolean("is_active");
    table.integer("duration");
    table.string("description");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("timers");
}
