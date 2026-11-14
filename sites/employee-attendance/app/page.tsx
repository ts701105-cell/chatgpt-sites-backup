"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eraser,
  Fingerprint,
  Loader2,
  RotateCcw,
  Send,
  Sheet,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

type DayType = "rest" | "regular";
type DaySelections = Record<number, DayType>;

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const TYPE_INFO: Record<DayType, { short: string; label: string }> = {
  rest: { short: "休", label: "休息日" },
  regular: { short: "例", label: "例假日" },
};

const initialSelections: DaySelections = {};

export default function Home() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(8);
  const [activeType, setActiveType] = useState<DayType>("rest");
  const [selections, setSelections] = useState<DaySelections>(initialSelections);
  const [submitted, setSubmitted] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstWeekday = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);
  const monthText = `${year} 年 ${month + 1} 月`;

  const selectedEntries = useMemo(
    () => Object.entries(selections)
      .map(([day, type]) => ({ day: Number(day), type }))
      .sort((a, b) => a.day - b.day),
    [selections],
  );
  const restCount = selectedEntries.filter((item) => item.type === "rest").length;
  const regularCount = selectedEntries.filter((item) => item.type === "regular").length;
  const totalCount = selectedEntries.length;

  const moveMonth = (direction: number) => {
    const next = new Date(year, month + direction, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelections({});
    setSubmitted(false);
  };

  const toggleDay = (day: number) => {
    setSubmitted(false);
    setSelections((current) => {
      const next = { ...current };
      if (next[day] === activeType) {
        delete next[day];
      } else {
        next[day] = activeType;
      }
      return next;
    });
  };

  const applyWeekends = () => {
    const next: DaySelections = {};
    for (let day = 1; day <= daysInMonth; day += 1) {
      const weekday = new Date(year, month, day).getDay();
      if (weekday === 6) next[day] = "rest";
      if (weekday === 0) next[day] = "regular";
    }
    setSelections(next);
    setSubmitted(false);
    toast.success("已自動套用週末", { description: "星期六標為休息日，星期日標為例假日。" });
  };

  const clearAll = () => {
    setSelections({});
    setSubmitted(false);
    toast("已清除本月選擇");
  };

  const submitSchedule = async () => {
    if (!employeeName.trim() || !employeeId.trim()) {
      toast.error("請先填寫姓名與員工編號");
      return;
    }
    if (totalCount === 0) {
      toast.error("請先選擇休假日期");
      return;
    }

    setIsSubmitting(true);
    try {
      const monthValue = `${year}-${String(month + 1).padStart(2, "0")}`;
      const toDate = (day: number) => `${monthValue}-${String(day).padStart(2, "0")}`;
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: employeeName.trim(),
          employeeId: employeeId.trim(),
          scheduleMonth: monthValue,
          restDays: selectedEntries.filter((item) => item.type === "rest").map((item) => toDate(item.day)),
          regularDays: selectedEntries.filter((item) => item.type === "regular").map((item) => toDate(item.day)),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "送出失敗，請稍後再試");

      setSubmitted(true);
      toast.success(`${monthText}排休已儲存`, {
        description: `休息日 ${restCount} 天・例假日 ${regularCount} 天，資料將同步至 Google 試算表。`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "送出失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ed] text-[#182338]">
      <Toaster position="top-center" richColors />

      <header className="border-b border-[#dad6ce] bg-[#fbfaf7]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1380px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[14px] bg-[#182f50] text-white shadow-[0_8px_22px_rgba(24,47,80,.2)]">
              <CalendarCheck2 className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[.18em] text-[#8a6d42]">ORBIT STAFF</p>
              <p className="text-[15px] font-extrabold tracking-tight">員工每月排休系統</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#ded9d0] bg-white px-3 py-2 text-xs font-bold text-[#596577]">
            <UserRound className="size-4 text-[#8b6b3e]" />
            <span>公開排休填報</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1380px] px-4 pb-14 pt-7 sm:px-6 lg:px-8">
        <section className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-[#8b6b3e]"><Sparkles className="size-3.5" /> 每月排休填報</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">選擇您的休假日期</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687383]">先選擇「休息日」或「例假日」，再點選日曆中的日期。再次點擊相同日期即可取消。</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#667180]">
            <span className="flex items-center gap-2"><i className="size-3 rounded-full bg-[#3775c5]" />藍色＝休息日</span>
            <span className="flex items-center gap-2"><i className="size-3 rounded-full bg-[#d75050]" />紅色＝例假日</span>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[310px_1fr]">
          <aside className="space-y-5">
            <article className="rounded-[26px] border border-[#dcd7ce] bg-[#fffefa] p-5 shadow-[0_14px_45px_rgba(47,42,34,.06)]">
              <p className="eyebrow">STEP 1</p>
              <h2 className="mt-1 text-lg font-extrabold">選擇標記類型</h2>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => setActiveType("rest")}
                  className={`type-choice rest ${activeType === "rest" ? "active" : ""}`}
                  aria-pressed={activeType === "rest"}
                >
                  <span className="type-symbol">休</span>
                  <span className="text-left"><strong>休息日</strong><small>點日期標記為藍色</small></span>
                  {activeType === "rest" && <Check className="ml-auto size-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveType("regular")}
                  className={`type-choice regular ${activeType === "regular" ? "active" : ""}`}
                  aria-pressed={activeType === "regular"}
                >
                  <span className="type-symbol">例</span>
                  <span className="text-left"><strong>例假日</strong><small>點日期標記為紅色</small></span>
                  {activeType === "regular" && <Check className="ml-auto size-5" />}
                </button>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#f4f1ea] p-3 text-[11px] leading-5 text-[#687383]">
                <CircleHelp className="mt-0.5 size-4 shrink-0 text-[#8b6b3e]" />
                日期選錯時，直接切換類型後再點一次，即可改為另一種假日。
              </div>
            </article>

            <article className="rounded-[26px] bg-[#182f50] p-5 text-white shadow-[0_18px_44px_rgba(24,47,80,.18)]">
              <div className="flex items-center justify-between">
                <div><p className="text-[10px] font-bold tracking-[.16em] text-[#c7d4e5]">已選擇</p><p className="mt-1 text-4xl font-bold">{totalCount}<span className="ml-1 text-sm font-semibold text-[#c7d4e5]">天</span></p></div>
                <div className="grid size-12 place-items-center rounded-2xl bg-white/10"><Fingerprint className="size-6 text-[#f3c774]" /></div>
              </div>
              <Progress value={Math.min((totalCount / 8) * 100, 100)} className="mt-5 h-2 bg-white/12 [&>div]:bg-[#f3c774]" />
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/8 p-3"><span className="text-[10px] text-[#c8d4e2]">休息日</span><p className="mt-1 text-xl font-bold text-[#8ec1ff]">{restCount} 天</p></div>
                <div className="rounded-2xl bg-white/8 p-3"><span className="text-[10px] text-[#c8d4e2]">例假日</span><p className="mt-1 text-xl font-bold text-[#ff9c9c]">{regularCount} 天</p></div>
              </div>
            </article>

            <article className="rounded-[26px] border border-[#dcd7ce] bg-[#fffefa] p-5 text-sm shadow-[0_14px_45px_rgba(47,42,34,.05)]">
              <p className="eyebrow">員工資料</p>
              <h2 className="mt-1 text-lg font-extrabold">填寫辨識資料</h2>
              <div className="mt-4 space-y-4">
                <label className="form-field">
                  <span>員工姓名</span>
                  <input value={employeeName} onChange={(event) => { setEmployeeName(event.target.value); setSubmitted(false); }} placeholder="例如：陳冠宇" maxLength={80} autoComplete="name" />
                </label>
                <label className="form-field">
                  <span>員工編號</span>
                  <input value={employeeId} onChange={(event) => { setEmployeeId(event.target.value); setSubmitted(false); }} placeholder="例如：A1057" maxLength={40} autoCapitalize="characters" />
                </label>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#eef4ec] p-3 text-[11px] leading-5 text-[#58705a]">
                <Sheet className="mt-0.5 size-4 shrink-0" />
                送出後會永久保存，並自動整理至 Google 試算表。
              </div>
            </article>
          </aside>

          <div className="space-y-5">
            <article className="rounded-[28px] border border-[#dcd7ce] bg-[#fffefa] p-4 shadow-[0_18px_55px_rgba(47,42,34,.07)] sm:p-7">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-full border-[#d9d4cb] bg-transparent" onClick={() => moveMonth(-1)} aria-label="上個月"><ChevronLeft className="size-4" /></Button>
                  <div className="min-w-42 text-center">
                    <p className="eyebrow">STEP 2</p>
                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{monthText}</h2>
                  </div>
                  <Button variant="outline" size="icon" className="rounded-full border-[#d9d4cb] bg-transparent" onClick={() => moveMonth(1)} aria-label="下個月"><ChevronRight className="size-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-full border-[#d9d4cb] bg-transparent" onClick={applyWeekends}><RotateCcw className="mr-1 size-3.5" />自動套用六、日</Button>
                  <Button variant="ghost" size="sm" className="rounded-full text-[#7c5d36]" onClick={clearAll}><Eraser className="mr-1 size-3.5" />全部清除</Button>
                </div>
              </div>

              <div className="calendar-shell">
                <div className="calendar-grid">
                  {WEEKDAYS.map((weekday, index) => (
                    <div key={weekday} className={`weekday ${index === 0 || index === 6 ? "weekend" : ""}`}>{weekday}</div>
                  ))}
                  {Array.from({ length: firstWeekday }).map((_, index) => <div key={`blank-${index}`} className="day-blank" />)}
                  {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                    const selectedType = selections[day];
                    const weekday = new Date(year, month, day).getDay();
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`day-cell ${selectedType ?? ""} ${weekday === 0 || weekday === 6 ? "is-weekend" : ""}`}
                        aria-pressed={Boolean(selectedType)}
                        aria-label={`${month + 1} 月 ${day} 日${selectedType ? `，${TYPE_INFO[selectedType].label}` : ""}`}
                      >
                        <span className="day-number">{day}</span>
                        {selectedType ? (
                          <span className="day-mark"><b>{TYPE_INFO[selectedType].short}</b><small>{TYPE_INFO[selectedType].label}</small></span>
                        ) : (
                          <span className="day-hint">點選</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>

            <article className="rounded-[28px] border border-[#dcd7ce] bg-[#fffefa] p-5 shadow-[0_14px_45px_rgba(47,42,34,.05)] sm:p-7">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <p className="eyebrow">STEP 3</p>
                  <h2 className="mt-1 text-xl font-extrabold">確認本月排休</h2>
                  {selectedEntries.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedEntries.map(({ day, type }) => (
                        <button key={day} onClick={() => toggleDay(day)} className={`date-chip ${type}`} title="點擊取消">
                          <span>{month + 1}/{day}</span><b>{TYPE_INFO[type].short}</b>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#7b8491]">尚未選擇日期，請在上方日曆點選。</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  {submitted && <span className="flex items-center justify-center gap-1.5 text-sm font-bold text-[#547057]"><Check className="size-4" />已儲存</span>}
                  <Button disabled={isSubmitting} onClick={submitSchedule} className="h-12 rounded-full bg-[#182f50] px-7 text-white shadow-[0_10px_25px_rgba(24,47,80,.2)] hover:bg-[#25466f] disabled:opacity-60">
                    {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                    {isSubmitting ? "資料儲存中" : "送出本月排休"}
                  </Button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
