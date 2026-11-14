import { env } from "cloudflare:workers";
import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { schedules } from "../../../db/schema";

function parseDays(value: string) {
  try {
    const days = JSON.parse(value);
    return Array.isArray(days) ? days.filter((day): day is string => typeof day === "string") : [];
  } catch {
    return [];
  }
}

function csvCell(value: string | number) {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!env.SYNC_KEY || key !== env.SYNC_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getDb().select().from(schedules).orderBy(asc(schedules.updatedAt));
  const records = rows.map((row) => {
    const restDays = parseDays(row.restDays);
    const regularDays = parseDays(row.regularDays);
    return {
      id: row.id,
      submittedAt: row.updatedAt,
      scheduleMonth: row.scheduleMonth,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      restDays: restDays.join("、"),
      regularDays: regularDays.join("、"),
      restCount: row.restCount,
      regularCount: row.regularCount,
      totalCount: row.restCount + row.regularCount,
    };
  });

  if (url.searchParams.get("format") === "csv") {
    const lines = records.length
      ? records.map((record) => [
          record.id,
          record.submittedAt,
          record.scheduleMonth,
          record.employeeId,
          record.employeeName,
          record.restDays,
          record.regularDays,
          record.restCount,
          record.regularCount,
          record.totalCount,
        ].map(csvCell).join(","))
      : [Array.from({ length: 10 }, () => csvCell("")).join(",")];

    return new Response(`\uFEFF${lines.join("\n")}\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  return Response.json({ records }, { headers: { "Cache-Control": "no-store" } });
}
