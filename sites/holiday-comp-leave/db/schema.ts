import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const compLeaveRecords = sqliteTable("comp_leave_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  department: text("department").notNull(),
  employee: text("employee").notNull(),
  holidayDate: text("holiday_date").notNull(),
  holidayName: text("holiday_name").notNull(),
  compensationStatus: text("compensation_status").notNull(),
  compensationDate: text("compensation_date"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
