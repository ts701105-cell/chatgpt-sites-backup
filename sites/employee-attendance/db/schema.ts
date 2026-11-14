import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const schedules = sqliteTable(
  "schedules",
  {
    id: text("id").primaryKey(),
    employeeId: text("employee_id").notNull(),
    employeeName: text("employee_name").notNull(),
    scheduleMonth: text("schedule_month").notNull(),
    restDays: text("rest_days").notNull().default("[]"),
    regularDays: text("regular_days").notNull().default("[]"),
    restCount: integer("rest_count").notNull().default(0),
    regularCount: integer("regular_count").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("schedules_employee_month_unique").on(table.employeeId, table.scheduleMonth),
  ],
);
