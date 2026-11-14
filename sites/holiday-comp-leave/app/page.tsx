"use client";

import { useMemo, useState } from "react";
import { Building2, CalendarCheck2, Check, ChevronRight, Clock3, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";

const employees: Record<string, string[]> = {
  行政部: ["王怡婷", "陳冠宇", "李佳穎"],
  財務部: ["林美玲", "黃志豪", "張雅雯"],
  業務部: ["吳俊傑", "蔡佩珊", "許家豪"],
  人資部: ["鄭淑芬", "劉育誠", "楊心怡"],
  資訊部: ["周柏廷", "謝承恩", "何欣蓉"],
  營運部: ["蘇建宏", "郭詩涵", "洪子翔"],
};

const holidays = [
  { date: "2026-01-01", name: "中華民國開國紀念日" },
  { date: "2026-02-16", name: "除夕" },
  { date: "2026-02-17", name: "春節（初一）" },
  { date: "2026-02-18", name: "春節（初二）" },
  { date: "2026-02-19", name: "春節（初三）" },
  { date: "2026-02-28", name: "和平紀念日" },
  { date: "2026-04-04", name: "兒童節" },
  { date: "2026-04-05", name: "清明節" },
  { date: "2026-05-01", name: "勞動節" },
  { date: "2026-06-19", name: "端午節" },
  { date: "2026-09-25", name: "中秋節" },
  { date: "2026-09-28", name: "孔子誕辰紀念日／教師節" },
  { date: "2026-10-10", name: "國慶日" },
  { date: "2026-10-25", name: "臺灣光復暨金門古寧頭大捷紀念日" },
  { date: "2026-12-25", name: "行憲紀念日" },
];

const months = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, "0");
  return { value: `2026-${month}`, label: `2026 年 ${index + 1} 月` };
});

const weekday = new Intl.DateTimeFormat("zh-TW", { weekday: "short" });

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}/${month}/${day}`;
}

export default function Home() {
  const [department, setDepartment] = useState("");
  const [employee, setEmployee] = useState("");
  const [month, setMonth] = useState("2026-09");
  const [holidayDate, setHolidayDate] = useState("");
  const [plan, setPlan] = useState<"same_month" | "later">("same_month");
  const [compDate, setCompDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<null | { id: number; employee: string; holidayName: string; compDate: string | null }>(null);

  const monthHolidays = useMemo(() => holidays.filter((holiday) => holiday.date.startsWith(month)), [month]);
  const selectedHoliday = holidays.find((item) => item.date === holidayDate);
  const [selectedYear, selectedMonth] = month.split("-").map(Number);
  const monthEnd = `${month}-${String(new Date(selectedYear, selectedMonth, 0).getDate()).padStart(2, "0")}`;
  const canSubmit = Boolean(
    department && employee && selectedHoliday &&
    (plan === "later" || (compDate && compDate.startsWith(month)))
  );

  async function submit() {
    if (!canSubmit || !selectedHoliday) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/comp-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department,
          employee,
          holidayDate: selectedHoliday.date,
          holidayName: selectedHoliday.name,
          compensationStatus: plan,
          compensationDate: plan === "later" ? null : compDate,
        }),
      });
      const result = (await response.json()) as { record?: { id: number; employee: string; holidayName: string; compensationDate: string | null }; error?: string };
      if (!response.ok || !result.record) throw new Error(result.error || "登記失敗");
      setReceipt({ id: result.record.id, employee: result.record.employee, holidayName: result.record.holidayName, compDate: result.record.compensationDate });
      toast.success("補休資料已完成登記");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登記失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f3] text-[#18302b]">
      <Toaster position="top-center" richColors />
      <header className="border-b border-[#d7e2db] bg-[#123d35] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#e8a75d] text-[#123d35]"><CalendarCheck2 className="size-6" aria-hidden="true" /></div>
            <div><p className="text-lg font-bold tracking-wide">員工國定假日補休系統</p><p className="text-xs text-white/65">2026 年補休登記</p></div>
          </div>
          <div className="hidden rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs text-white/75 sm:block">不含上下班打卡</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[220px_1fr] lg:py-10">
        <aside className="rounded-[28px] bg-[#e4ece6] p-5 lg:min-h-[590px]">
          <p className="mb-6 text-xs font-semibold tracking-[0.18em] text-[#60746e]">登記流程</p>
          <ol className="space-y-2">
            {[
              ["1", "選擇員工", department && employee],
              ["2", "選擇國定假日", holidayDate],
              ["3", "安排補休", plan === "later" || compDate],
            ].map(([number, label, done], index) => (
              <li key={String(number)} className="flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-3">
                <span className={`grid size-8 place-items-center rounded-full text-sm font-bold ${done ? "bg-[#28695b] text-white" : "bg-white text-[#6b7d77]"}`}>{done ? <Check className="size-4" /> : number}</span>
                <span className="text-sm font-semibold">{label}</span>
                {index < 2 && <ChevronRight className="ml-auto size-4 text-[#8ca098] lg:hidden" />}
              </li>
            ))}
          </ol>
          <div className="mt-7 rounded-2xl border border-[#cddbd2] bg-[#f6f9f6] p-4 text-xs leading-6 text-[#60746e]">「當月補休」可選國定假日前後的任何同月份日期；日期還沒確定時，請選「之後補休」。</div>
        </aside>

        <section>
          <div className="mb-6"><p className="text-sm font-semibold text-[#b36d2e]">補休日期登記</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">今天要登記哪一天的補休？</h1></div>
          <Card className="overflow-hidden rounded-[28px] border-[#d8e2dc] bg-white shadow-[0_20px_60px_rgba(27,58,49,0.08)]">
            <CardContent className="p-5 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department" className="flex items-center gap-2 text-sm font-bold"><Building2 className="size-4 text-[#b36d2e]" />員工部門</Label>
                  <Select value={department} onValueChange={(value) => { setDepartment(value); setEmployee(""); setReceipt(null); }}>
                    <SelectTrigger id="department" className="h-12 w-full rounded-xl border-[#cdd9d2] bg-[#f9fbf9]"><SelectValue placeholder="請先選擇部門" /></SelectTrigger>
                    <SelectContent>{Object.keys(employees).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee" className="flex items-center gap-2 text-sm font-bold"><UserRound className="size-4 text-[#b36d2e]" />員工姓名</Label>
                  <Select disabled={!department} value={employee} onValueChange={(value) => { setEmployee(value); setReceipt(null); }}>
                    <SelectTrigger id="employee" className="h-12 w-full rounded-xl border-[#cdd9d2] bg-[#f9fbf9]"><SelectValue placeholder={department ? "請選擇姓名" : "請先選擇部門"} /></SelectTrigger>
                    <SelectContent>{(employees[department] || []).map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="my-7 h-px bg-[#e4ebe6]" />
              <div className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div><Label htmlFor="month" className="text-sm font-bold">國定假日月份</Label><p className="mt-1 text-xs text-[#6b7d77]">選擇當月曾出勤的國定假日</p></div>
                  <Select value={month} onValueChange={(value) => { setMonth(value); setHolidayDate(""); setCompDate(""); setReceipt(null); }}>
                    <SelectTrigger id="month" className="h-10 min-w-40 rounded-xl border-[#cdd9d2]"><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {monthHolidays.length ? (
                  <RadioGroup value={holidayDate} onValueChange={(value) => { setHolidayDate(value); setCompDate(""); setReceipt(null); }} className="grid gap-3 sm:grid-cols-2">
                    {monthHolidays.map((holiday) => (
                      <label key={holiday.date} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${holidayDate === holiday.date ? "border-[#28695b] bg-[#eef6f1] ring-2 ring-[#28695b]/10" : "border-[#dbe4de] hover:border-[#9fb5aa]"}`}>
                        <RadioGroupItem value={holiday.date} aria-label={holiday.name} />
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f1d6b5] text-center text-xs font-bold text-[#7d4a1f]">{holiday.date.slice(5).replace("-", "/")}</span>
                        <span><span className="block font-bold">{holiday.name}</span><span className="mt-1 block text-xs text-[#71827c]">{weekday.format(new Date(`${holiday.date}T12:00:00+08:00`))}</span></span>
                      </label>
                    ))}
                  </RadioGroup>
                ) : <div className="rounded-2xl border border-dashed border-[#cbd8d0] bg-[#f8faf8] px-5 py-8 text-center text-sm text-[#71827c]">此月份沒有國定假日</div>}
              </div>

              <div className="my-7 h-px bg-[#e4ebe6]" />
              <fieldset disabled={!selectedHoliday} className="space-y-3 disabled:opacity-45">
                <legend className="text-sm font-bold">補休安排</legend>
                <RadioGroup value={plan} onValueChange={(value) => { setPlan(value as "same_month" | "later"); setReceipt(null); }} className="grid gap-3 sm:grid-cols-2">
                  <label className={`cursor-pointer rounded-2xl border p-4 ${plan === "same_month" ? "border-[#28695b] bg-[#eef6f1]" : "border-[#dbe4de]"}`}>
                    <span className="flex items-center gap-3"><RadioGroupItem value="same_month" /><CalendarCheck2 className="size-5 text-[#28695b]" /><span className="font-bold">當月補休</span></span>
                    <span className="mt-1 block text-xs leading-5 text-[#71827c]">可選國定假日前後的任何同月份日期</span>
                    <span className="mt-4 block"><Label htmlFor="comp-date" className="sr-only">當月補休日期</Label><Input id="comp-date" type="date" min={`${month}-01`} max={monthEnd} value={compDate} disabled={plan !== "same_month"} onChange={(event) => { setCompDate(event.target.value); setReceipt(null); }} className="h-11 rounded-xl bg-white" /></span>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${plan === "later" ? "border-[#b36d2e] bg-[#fff7ed]" : "border-[#dbe4de]"}`}>
                    <RadioGroupItem value="later" className="mt-0.5" /><Clock3 className="size-5 text-[#b36d2e]" />
                    <span><span className="block font-bold">之後補休</span><span className="mt-1 block text-xs leading-5 text-[#71827c]">先記錄為跨月補休，日期日後再安排</span></span>
                  </label>
                </RadioGroup>
              </fieldset>

              {receipt && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#b8d6c4] bg-[#edf8f1] p-4" role="status"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#28695b] text-white"><Check className="size-4" /></span><div><p className="font-bold">登記完成｜編號 #{receipt.id}</p><p className="mt-1 text-sm text-[#536a62]">{receipt.employee}・{receipt.holidayName}・{receipt.compDate ? `當月補休：${formatDate(receipt.compDate)}` : "之後補休"}</p></div></div>}

              <div className="mt-7 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-xs text-[#71827c] sm:text-left">送出後會建立正式補休紀錄</p>
                <Button type="button" disabled={!canSubmit || submitting} onClick={submit} className="h-12 rounded-xl bg-[#123d35] px-8 font-bold text-white hover:bg-[#205348]">{submitting ? "登記中…" : "確認送出"}</Button>
              </div>
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-xs text-[#71827c]">2026 國定假日依行政院人事行政總處辦公日曆表整理</p>
        </section>
      </div>
    </main>
  );
}
