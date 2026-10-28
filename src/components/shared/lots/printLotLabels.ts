// ─────────────────────────────────────────────────────────────
// พิมพ์ฉลากบาร์โค้ดของล็อต — เครื่องพิมพ์สติ๊กเกอร์ (thermal) ผ่านหน้าต่างพิมพ์ของเบราว์เซอร์
// 1 ดวง = 1 หน้า (@page ขนาดเท่าฉลาก ไม่มีขอบ) · บาร์โค้ด Code128 ของ lot_no (JsBarcode → SVG คมทุกความละเอียด)
// บนฉลาก: ชื่อสินค้า · บาร์โค้ด · เลขล็อต · วันผลิต/วันหมดอายุ (เป็นตัวหนังสือ — ลูกค้าอ่านได้โดยไม่ต้องสแกน)
// ต้องเรียกจาก click handler ตรง ๆ — เปิดหน้าต่างก่อน await อย่างอื่น ไม่งั้นเบราว์เซอร์บล็อกป๊อปอัป
// ─────────────────────────────────────────────────────────────
import type { ProductLot } from "@/types/productLot";

export const LABEL_SIZES = {
  "50x30": { w: 50, h: 30 },
  "40x30": { w: 40, h: 30 },
  "60x40": { w: 60, h: 40 },
} as const;
export type LabelSize = keyof typeof LABEL_SIZES;

export interface LabelTexts {
  produced: string;
  expires: string;
  noExpiry: string;
}

export interface LabelJob {
  lot: ProductLot;
  copies: number;
}

/** "2026-10-28" → "28/10/69" (th = พ.ศ.) / "28/10/26" */
export function labelDate(ymd: string, locale: string): string {
  const [y, m, d] = ymd.split("-");
  const year = locale.startsWith("th") ? Number(y) + 543 : Number(y);
  return `${d}/${m}/${String(year).slice(-2)}`;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** คืน false = เบราว์เซอร์บล็อกหน้าต่างพิมพ์ */
export async function printLotLabels(jobs: LabelJob[], size: LabelSize, locale: string, texts: LabelTexts): Promise<boolean> {
  const win = window.open("", "_blank", "width=480,height=640");
  if (!win) return false;

  const { default: JsBarcode } = await import("jsbarcode");
  const { w, h } = LABEL_SIZES[size];
  const barcodes = new Map<string, string>();
  for (const { lot } of jobs) {
    if (barcodes.has(lot.lot_no)) continue;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svg, lot.lot_no, { format: "CODE128", displayValue: false, margin: 0, height: 40, width: 2 });
    // ยืดเต็มกว้างฉลาก (CSS) — อัตราส่วนแท่งต่อช่องว่างคงเดิม เครื่องยิงอ่านได้
    svg.setAttribute("preserveAspectRatio", "none");
    barcodes.set(lot.lot_no, svg.outerHTML);
  }

  const label = (lot: ProductLot) => {
    const dates = [
      `${texts.produced} ${labelDate(lot.produced_date, locale)}`,
      lot.expiry_date ? `${texts.expires} ${labelDate(lot.expiry_date, locale)}` : texts.noExpiry,
    ].join(" · ");
    return `<section class="label">
  <div class="name">${escapeHtml(lot.product_name_th ?? "")}</div>
  <div class="code">${barcodes.get(lot.lot_no)}</div>
  <div class="no">${escapeHtml(lot.lot_no)}</div>
  <div class="dates">${escapeHtml(dates)}</div>
</section>`;
  };
  const body = jobs.flatMap(({ lot, copies }) => Array.from({ length: copies }, () => label(lot))).join("\n");

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(jobs.map((j) => j.lot.lot_no).join(", "))}</title>
<style>
  @page { size: ${w}mm ${h}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Sarabun", "Tahoma", sans-serif; color: #000; }
  .label { width: ${w}mm; height: ${h}mm; padding: 1.5mm 2mm; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; page-break-after: always; break-after: page; }
  .label:last-child { page-break-after: auto; break-after: auto; }
  .name { font-size: ${h >= 40 ? 10 : 8.5}pt; font-weight: 700; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .code svg { display: block; width: 100%; height: ${h >= 40 ? 16 : 11}mm; }
  .no { font-family: "Consolas", "Courier New", monospace; font-size: 8pt; text-align: center; letter-spacing: 0.5pt; line-height: 1; }
  .dates { font-size: ${h >= 40 ? 8.5 : 7}pt; text-align: center; line-height: 1.1; white-space: nowrap; }
</style></head>
<body>${body}</body></html>`);
  win.document.close();
  win.onafterprint = () => win.close();
  // รอ layout/ฟอนต์ก่อนสั่งพิมพ์
  win.setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
  return true;
}
