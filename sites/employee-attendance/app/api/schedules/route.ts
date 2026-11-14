import { sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { schedules } from "../../../db/schema";

type SchedulePayload = {
  employeeId?: unknown;
  employeeName?: unknown;
  scheduleMonth?: unknown;
  restDays?: unknown;
  regularDays?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanDates(value: unknown, month: string) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value)]
    .filter((item): item is string => typeof item === "string")
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item) && item.startsWith(`${month}-`))
    .sort();
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SchedulePayload;
    const employeeId = cleanText(payload.employeeId, 40);
    const employeeName = cleanText(payload.employeeName, 80);
    const scheduleMonth = cleanText(payload.scheduleMonth, 7);

    if (!employeeId || !employeeName) {
      return Response.json({ error: "姓名與員工編號為必填欄位" }, { status: 400 });
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(scheduleMonth)) {
      return Response.json({ error: "排休月份格式錯誤" }, { status: 400 });
    }

    const restDays = cleanDates(payload.restDays, scheduleMonth);
    const regularDays = cleanDates(payload.regularDays, scheduleMonth);
    const overlap = restDays.some((day) => regularDays.includes(day));
    if (overlap || restDays.length + regularDays.length === 0) {
      return Response.json({ error: overlap ? "同一天不能同時標記兩種假日" : "請至少選擇一個休假日" }, { status: 400 });
    }

    const db = getDb();
    const [schedule] = await db
      .insert(schedules)
      .values({
        id: crypto.randomUUID(),
        employeeId,
        employeeName,
        scheduleMonth,
        restDays: JSON.stringify(restDays),
        regularDays: JSON.stringify(regularDays),
        restCount: restDays.length,
        regularCount: regularDays.length,
      })
      .onConflictDoUpdate({
        target: [schedules.employeeId, schedules.scheduleMonth],
        set: {
          employeeName,
          restDays: JSON.stringify(restDays),
          regularDays: JSON.stringify(regularDays),
          restCount: restDays.length,
          regularCount: regularDays.length,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning({ id: schedules.id, updatedAt: schedules.updatedAt });

    return Response.json({ schedule }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
