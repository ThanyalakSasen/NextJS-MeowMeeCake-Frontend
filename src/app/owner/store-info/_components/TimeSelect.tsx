"use client";
// เลือกเวลา 24 ชม. (HH:mm) — ชั่วโมง + นาที (ทีละ 5 นาที · ค่าเดิมที่ไม่ลงตัวยังแสดงอยู่)
import { Select } from "@/components/base";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export function TimeSelect({ value, onChange, disabled, ariaLabel }: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const [h = "00", m = "00"] = value.split(":");
  const minutes = MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort();
  return (
    <span className="inline-flex items-center gap-1" aria-label={ariaLabel}>
      <Select
        style={{ width: 72 }}
        value={h}
        disabled={disabled}
        options={HOURS.map((x) => ({ value: x, label: x }))}
        onChange={(v: string) => onChange(`${v}:${m}`)}
      />
      <span className="text-gray-400">:</span>
      <Select
        style={{ width: 72 }}
        value={m}
        disabled={disabled}
        options={minutes.map((x) => ({ value: x, label: x }))}
        onChange={(v: string) => onChange(`${h}:${v}`)}
      />
    </span>
  );
}
