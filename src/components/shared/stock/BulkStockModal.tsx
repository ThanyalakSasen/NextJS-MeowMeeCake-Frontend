"use client";
// ─────────────────────────────────────────────────────────────
// BulkStockModal — รับเข้า / เบิกใช้ / ปรับยอด "หลายรายการพร้อมกัน" (ใช้ทั้งหน้าสต็อกวัตถุดิบและสต็อกสินค้า)
// backend ไม่มี endpoint แบบ bulk — ผู้เรียกส่งทีละรายการใน onSubmit แล้วคืน { [id]: ข้อความ error } ของที่ไม่สำเร็จ
// สำเร็จหมด → ปิดหน้าต่าง · บางรายการไม่สำเร็จ → เหลือเฉพาะรายการนั้นพร้อมเหตุผล ให้แก้แล้วกดใหม่ได้ (ที่สำเร็จไม่ส่งซ้ำ)
// เลือกรายการซ้ำไม่ได้ (ตัวเลือกที่ใช้แล้วถูกปิด) · เบิกใช้เกินคงเหลือเตือนก่อนส่ง · จำนวนเกิน max (stockLimits.ts) เตือนก่อนส่ง
// withDates (วัตถุดิบ): วันที่ทำรายการต่อแถว (ค่าเริ่มต้นวันนี้ · ห้ามอนาคต) + วันหมดอายุเฉพาะโหมดรับเข้า (ไม่บังคับ · ไม่ก่อนวันรับ)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Modal, Radio } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button, DatePicker, Input, InputNumber, Select } from "@/components/base";
import { formatNumber } from "@/i18n/format";
import { actionIcon, modalButtonIcons } from "@/components/shared/actions";
import { sortOptionsThai } from "@/lib/thaiSort";
import { isIntegerOnlyUnit } from "@/constants/ingredientCategoryUnits";

export type BulkStockMode = "receive" | "use" | "adjust";

export interface BulkStockItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  maxStock?: number | null;
}

export interface BulkStockLine {
  id: string;
  value: number;
  note?: string;
  /** ISO — วันที่รับเข้า/เบิกใช้/นับจริง (มีเฉพาะ withDates) · วันนี้ = เวลาปัจจุบัน */
  date?: string;
  /** ISO — วันหมดอายุของล็อตที่รับเข้า (เฉพาะโหมดรับเข้า · ไม่บังคับ) */
  expiry?: string;
}

interface Line {
  key: number;
  id: string | null;
  value: number | null;
  note: string;
  date: Dayjs;
  expiry: Dayjs | null;
}

let seq = 0;
const newLine = (): Line => ({ key: ++seq, id: null, value: null, note: "", date: dayjs(), expiry: null });

/** วันที่เลือก → ISO · วันนี้ใช้เวลาปัจจุบัน (เรียงในประวัติถูก) · วันก่อนหน้าใช้เที่ยงวัน (ไม่เลื่อนวันเพราะเขตเวลา) */
const dateIso = (d: Dayjs) => (d.isSame(dayjs(), "day") ? dayjs() : d.hour(12).minute(0).second(0)).toISOString();

export function BulkStockModal({
  open,
  items,
  withNote = false,
  withDates = false,
  initialIds = [],
  decimals = 0,
  max,
  onClose,
  onSubmit,
}: {
  open: boolean;
  items: BulkStockItem[];
  /** ช่องหมายเหตุต่อรายการ (วัตถุดิบเก็บในประวัติวัตถุดิบ · สินค้าเก็บในบันทึกการทำงาน) */
  withNote?: boolean;
  /** วันที่ทำรายการ + วันหมดอายุ (รับเข้า) ต่อรายการ — วัตถุดิบ (backend เก็บ transaction_date / expiry_date) */
  withDates?: boolean;
  /** รายการที่ใส่ไว้ให้ตอนเปิด (เช่น ใกล้หมด/หมดสต็อก) — ลบออกหรือเพิ่มแถวอื่นได้ตามปกติ */
  initialIds?: string[];
  /** ทศนิยมของจำนวน (สินค้า = 0 · วัตถุดิบ = 2) */
  decimals?: number;
  /** จำนวนสูงสุดต่อรายการ (PRODUCT_STOCK_MAX / INGREDIENT_STOCK_MAX) */
  max: number;
  onClose: () => void;
  /** ส่งทีละรายการ — คืน { [id]: เหตุผล } ของรายการที่ไม่สำเร็จ (ว่าง = สำเร็จหมด) */
  onSubmit: (mode: BulkStockMode, lines: BulkStockLine[]) => Promise<Record<string, string>>;
}) {
  return (
    <Modal open={open} footer={null} closable={false} width={withDates ? 1080 : 760} destroyOnHidden onCancel={onClose}>
      {/* เนื้อหาแยก component — state เริ่มใหม่ทุกครั้งที่เปิด (destroyOnHidden) */}
      {open && <Body items={items} withNote={withNote} withDates={withDates} initialIds={initialIds} decimals={decimals} max={max} onClose={onClose} onSubmit={onSubmit} />}
    </Modal>
  );
}

function Body({
  items,
  withNote,
  withDates,
  initialIds,
  decimals,
  max,
  onClose,
  onSubmit,
}: {
  items: BulkStockItem[];
  withNote: boolean;
  withDates: boolean;
  initialIds: string[];
  decimals: number;
  max: number;
  onClose: () => void;
  onSubmit: (mode: BulkStockMode, lines: BulkStockLine[]) => Promise<Record<string, string>>;
}) {
  const t = useTranslations("bulkStock");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [mode, setMode] = useState<BulkStockMode>("receive");
  // ใส่รายการที่ส่งมาไว้ก่อน (+ แถวว่าง 1 แถวไว้เพิ่มรายการอื่น) · ไม่มี = แถวว่าง 3 แถว
  const [lines, setLines] = useState<Line[]>(() => {
    const known = initialIds.filter((id) => items.some((i) => i.id === id));
    return known.length ? [...known.map((id) => ({ ...newLine(), id })), newLine()] : [newLine(), newLine(), newLine()];
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const byId = new Map(items.map((i) => [i.id, i]));
  const used = new Set(lines.map((l) => l.id).filter(Boolean));
  const filled = lines.filter((l) => l.id && l.value != null);

  const exceeds = (l: Line) => mode === "use" && !!l.id && l.value != null && l.value > (byId.get(l.id)?.stock ?? 0);
  const tooLarge = (l: Line) => l.value != null && l.value > max;
  const exceedsMax = (l: Line) => {
    if (!l.id || l.value == null) return false;
    const item = byId.get(l.id);
    if (!item || item.maxStock == null || item.maxStock <= 0) return false;
    if (mode === "receive") return item.stock + l.value > item.maxStock;
    if (mode === "adjust") return l.value > item.maxStock;
    return false;
  };
  const badExpiry = (l: Line) => mode === "receive" && !!l.expiry && l.expiry.isBefore(l.date, "day");
  const invalid =
    filled.length === 0 ||
    lines.some(exceeds) ||
    lines.some(exceedsMax) ||
    lines.some(tooLarge) ||
    lines.some(badExpiry) ||
    lines.some((l) => !!l.id !== (l.value != null));
  const showExpiry = withDates && mode === "receive";

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  // ปรับยอด: เลือกรายการแล้วใส่ยอดปัจจุบันไว้ก่อน (แก้เป็นยอดที่นับได้) · รับเข้า/เบิกใช้: เริ่มว่าง
  const pick = (key: number, id: string) =>
    update(key, { id, value: mode === "adjust" ? (byId.get(id)?.stock ?? 0) : null });

  const submit = async () => {
    setSaving(true);
    try {
      const failed = await onSubmit(
        mode,
        filled.map((l) => ({
          id: l.id as string,
          value: l.value as number,
          note: l.note.trim() || undefined,
          ...(withDates ? { date: dateIso(l.date) } : {}),
          ...(showExpiry && l.expiry ? { expiry: l.expiry.startOf("day").toISOString() } : {}),
        })),
      );
      if (Object.keys(failed).length === 0) return onClose();
      setErrors(failed);
      setLines((ls) => ls.filter((l) => l.id && failed[l.id]));
    } finally {
      setSaving(false);
    }
  };

  // คอลัมน์: รายการ · จำนวน · [วันที่] · [วันหมดอายุ] · [หมายเหตุ] · ลบ
  const gridTemplateColumns = [
    "minmax(0,1fr)",
    withNote ? "8rem" : "9rem",
    withDates && "9.5rem",
    showExpiry && "9.5rem",
    withNote && "minmax(0,0.8fr)",
    "2rem",
  ].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-4">
      <h3 className="m-0 text-lg font-semibold text-brown-900">{t("title")}</h3>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">{t("modeLabel")}</span>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          onChange={(e) => {
            const nextMode = e.target.value as BulkStockMode;
            setMode(nextMode);
            setErrors({});
            // เปลี่ยนโหมด → จำนวนเดิมความหมายเปลี่ยน (ส่วนต่าง ↔ ยอดใหม่) จึงล้างจำนวนแต่คงรายการที่เลือกไว้
            // ถ้าสลับไปโหมดเบิกใช้ (use) รายการที่สต็อกเป็น 0 เบิกไม่ได้ ให้ล้างรายการนั้นออก
            setLines((ls) =>
              ls.map((l) => {
                const stock = l.id ? (byId.get(l.id)?.stock ?? 0) : 0;
                if (nextMode === "use" && l.id && stock <= 0) {
                  return { ...l, id: null, value: null };
                }
                return { ...l, value: nextMode === "adjust" && l.id ? stock : null };
              }),
            );
          }}
          options={(["receive", "use", "adjust"] as const).map((m) => ({ value: m, label: t(`mode_${m}`) }))}
        />
      </div>
      <p className="m-0 text-sm text-gray-600">{t(`hint_${mode}`)}</p>

      <div className="flex flex-col gap-2">
        <div className="grid gap-2 px-1 text-xs font-medium text-gray-500" style={{ gridTemplateColumns }}>
          <span>{t("colItem")}</span>
          <span>{mode === "adjust" ? t("colNewStock") : t("colQty")}</span>
          {withDates && <span>{t(`colDate_${mode}`)}</span>}
          {showExpiry && <span>{t("colExpiry")}</span>}
          {withNote && <span>{t("colNote")}</span>}
          <span />
        </div>

        {lines.map((l) => {
          const item = l.id ? byId.get(l.id) : undefined;
          const lineDecimals = item && isIntegerOnlyUnit(item.unit) ? 0 : decimals;
          const err =
            (l.id && errors[l.id]) ||
            (exceeds(l) ? t("exceeds", { qty: formatNumber(item?.stock ?? 0, locale), unit: item?.unit ?? "" }) : "") ||
            (tooLarge(l) ? t("tooLarge", { max: formatNumber(max, locale) }) : "") ||
            (exceedsMax(l) ? t("exceedsMax", { max: formatNumber(item?.maxStock ?? 0, locale), unit: item?.unit ?? "" }) : "") ||
            (badExpiry(l) ? t("expiryBeforeDate") : "");
          return (
            <div key={l.key} className="flex flex-col gap-0.5">
              <div className="grid items-start gap-2" style={{ gridTemplateColumns }}>
                <div className="min-w-0">
                  <Select
                    showSearch
                    optionFilterProp="label"
                    aria-label={t("colItem")}
                    placeholder={t("selectItem")}
                    value={l.id ?? undefined}
                    onChange={(v) => pick(l.key, v as string)}
                    options={sortOptionsThai(
                      items.map((i) => ({
                        value: i.id,
                        label: i.name,
                        disabled: (used.has(i.id) && i.id !== l.id) || (mode === "use" && i.stock <= 0),
                      })),
                    )}
                    className="w-full"
                  />
                  {item && (
                    <p className="m-0 mt-0.5 text-xs text-gray-500">
                      {t("current", { qty: formatNumber(item.stock, locale), unit: item.unit })}
                    </p>
                  )}
                </div>
                <InputNumber
                  min={mode === "adjust" ? 0 : lineDecimals ? 0.01 : 1}
                  precision={lineDecimals}
                  value={l.value}
                  disabled={!l.id}
                  status={err ? "error" : undefined}
                  onKeyDown={(e) => {
                    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) return;
                    if (/^[0-9]$/.test(e.key)) return;
                    if (lineDecimals > 0 && e.key === ".") {
                      const val = (e.currentTarget as HTMLInputElement | null)?.value ?? "";
                      if (!val.includes(".")) return;
                    }
                    e.preventDefault();
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData?.getData("text") ?? "";
                    const pattern = lineDecimals > 0 ? /^\d*(\.\d*)?$/ : /^\d*$/;
                    if (!pattern.test(text.trim())) e.preventDefault();
                  }}
                  onChange={(v) => update(l.key, { value: v == null ? null : Number(v) })}
                  className="!w-full"
                />
                {withDates && (
                  <DatePicker
                    format="DD/MM/YYYY"
                    allowClear={false}
                    value={l.date}
                    disabled={!l.id}
                    disabledDate={(d) => d.isAfter(dayjs(), "day")}
                    onChange={(d) => d && !Array.isArray(d) && update(l.key, { date: d })}
                    className="!w-full"
                  />
                )}
                {showExpiry && (
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder={t("expiryPlaceholder")}
                    value={l.expiry}
                    disabled={!l.id}
                    status={badExpiry(l) ? "error" : undefined}
                    disabledDate={(d) => d.isBefore(l.date, "day")}
                    onChange={(d) => update(l.key, { expiry: d && !Array.isArray(d) ? d : null })}
                    className="!w-full"
                  />
                )}
                {withNote && (
                  <Input value={l.note} maxLength={200} disabled={!l.id} placeholder={t("notePlaceholder")} onChange={(e) => update(l.key, { note: e.target.value })} />
                )}
                <Button
                  type="text"
                  aria-label={tc("delete")}
                  icon={<TrashIcon className="h-4 w-4" />}
                  disabled={lines.length === 1}
                  onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                />
              </div>
              {err && <p className="m-0 text-xs text-rose-600">{err}</p>}
            </div>
          );
        })}

        <div>
          <Button size="small" icon={actionIcon("add", "small")} onClick={() => setLines((ls) => [...ls, newLine()])}>
            {t("addLine")}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-600">{t("count", { n: filled.length })}</span>
        <div className="flex gap-2">
          <Button icon={modalButtonIcons(mode).cancelButtonProps.icon} onClick={onClose}>{tc("cancel")}</Button>
          <Button type="primary" icon={actionIcon(mode)} loading={saving} disabled={invalid} onClick={submit}>
            {t(`submit_${mode}`, { n: filled.length })}
          </Button>
        </div>
      </div>
    </div>
  );
}
