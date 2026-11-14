import { getDb } from "../../../db";
import { compLeaveRecords } from "../../../db/schema";

const GOOGLE_SHEETS_WEBHOOK = "https://script.google.com/macros/s/AKfycbxPn20TyqvsLm1YNlIVl6usClpbJ34KqjUipWf-SnJ1pLIvRQRmFr0Ng2Zr35Bpjmi2iw/exec";

type Payload = {
  department?: string;
  employee?: string;
  holidayDate?: string;
  holidayName?: string;
  compensationStatus?: "same_month" | "later";
  compensationDate?: string | null;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Payload;
    const required = [payload.department, payload.employee, payload.holidayDate, payload.holidayName, payload.compensationStatus];
    if (required.some((value) => !value?.trim())) return Response.json({ error: "請完成所有必要欄位" }, { status: 400 });
    if (payload.compensationStatus === "same_month" && !payload.compensationDate) return Response.json({ error: "請選擇當月補休日期" }, { status: 400 });
    if (payload.compensationStatus === "same_month" && payload.compensationDate && payload.holidayDate && payload.compensationDate.slice(0, 7) !== payload.holidayDate.slice(0, 7)) return Response.json({ error: "當月補休必須安排在同一個月份" }, { status: 400 });

    const db = getDb();
    const [record] = await db.insert(compLeaveRecords).values({
      department: payload.department!,
      employee: payload.employee!,
      holidayDate: payload.holidayDate!,
      holidayName: payload.holidayName!,
      compensationStatus: payload.compensationStatus!,
      compensationDate: payload.compensationStatus === "later" ? null : payload.compensationDate,
      createdAt: new Date(),
    }).returning();
    const sheetResponse = await fetch(GOOGLE_SHEETS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        department: record.department,
        employee: record.employee,
        holidayDate: record.holidayDate,
        holidayName: record.holidayName,
        compensationStatus: record.compensationStatus,
        compensationDate: record.compensationDate,
      }),
    });
    if (!sheetResponse.ok) throw new Error("Google 試算表同步失敗");
    return Response.json({ record }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "登記失敗" }, { status: 500 });
  }
}
