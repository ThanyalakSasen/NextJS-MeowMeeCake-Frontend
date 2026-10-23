"use client";
// สรุปใต้ข้อความในตาราง log — ตัวระบุรายการ (เช่น "ตำแหน่ง (Role): ผู้จัดการ · เมนู: POS") +
// การเปลี่ยนแปลงสูงสุด 2 ฟิลด์ ("มูลค่าส่วนลด: 20 → 50") ที่เหลือบอกจำนวน · ดูครบใน drawer
import { useTranslations } from "next-intl";
import type { UserLog } from "@/types/userLog";
import { useLogChanges } from "../useLogChanges";

const MAX_LINES = 2;

export function ChangeSummary({ log }: { log: Pick<UserLog, "before" | "after" | "context" | "entity"> }) {
  const t = useTranslations("systemLog");
  const { changesOf, summaryOf, contextOf } = useLogChanges();
  const rows = changesOf(log);
  const context = contextOf(log);
  if (rows.length === 0 && !context) return null;
  return (
    <div className="mt-1 flex flex-col gap-0.5 text-xs text-gray-500">
      {context && (
        <p className="m-0 max-w-[28rem] truncate font-medium text-gray-600" title={context}>
          {context}
        </p>
      )}
      {rows.slice(0, MAX_LINES).map((r) => (
        <p key={r.field} className="m-0 max-w-[28rem] truncate" title={summaryOf(r)}>
          {summaryOf(r)}
        </p>
      ))}
      {rows.length > MAX_LINES && <p className="m-0">{t("moreChanges", { n: rows.length - MAX_LINES })}</p>}
    </div>
  );
}
