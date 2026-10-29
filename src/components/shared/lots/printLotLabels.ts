// ─────────────────────────────────────────────────────────────
// พิมพ์ฉลากบาร์โค้ดของล็อต — กระดาษสติ๊กเกอร์ A4 (เครื่องพิมพ์ธรรมดา) ผ่านหน้าต่างพิมพ์ของเบราว์เซอร์
// 1 หน้า = 1 แผ่น A4 (@page ไม่มีขอบ) · วางดวงตามตำแหน่งจริงของแผ่น (SHEET_PRESETS) เป็นมม.
// บาร์โค้ด Code128 สองอันแยกกัน (JsBarcode → SVG คมทุกความละเอียด):
//   - รหัสสินค้า (pos-/pre-) — ยิงที่ POS ลงบิลได้เหมือนเดิม
//   - รหัสประจำชิ้น "<เลขล็อต>-<ลำดับชิ้น>" (เก็บใน DB — productLotsService.pieces) — ไม่ซ้ำกันทุกชิ้น · ยิงที่ "สแกนล็อต" ดูวันผลิต/วันหมดอายุ/ใบสั่งผลิต/ชิ้นที่
// บนฉลาก: ชื่อร้าน · ชื่อสินค้า · ราคา · บาร์โค้ดสองอัน · วันผลิต/วันหมดอายุ (เป็นตัวหนังสือ — ลูกค้าอ่านได้โดยไม่ต้องสแกน)
// ต้องเรียกจาก click handler ตรง ๆ — เปิดหน้าต่างก่อน await อย่างอื่น ไม่งั้นเบราว์เซอร์บล็อกป๊อปอัป
// ─────────────────────────────────────────────────────────────
import type { ProductLot } from "@/types/productLot";

/** แผ่นสติ๊กเกอร์ A4 ที่ขายทั่วไป — ขนาดดวง/ขอบบน-ซ้าย/ระยะห่างระหว่างดวง เป็นมม. */
export const SHEET_PRESETS = {
  "a4-21": { cols: 3, rows: 7, w: 70, h: 42.3, top: 0.15, left: 0, gapX: 0, gapY: 0 },
  "a4-24": { cols: 3, rows: 8, w: 70, h: 37, top: 0.5, left: 0, gapX: 0, gapY: 0 },
  "a4-21-margin": { cols: 3, rows: 7, w: 63.5, h: 38.1, top: 15.15, left: 7.2, gapX: 2.5, gapY: 0 },
} as const;
export type SheetPreset = keyof typeof SHEET_PRESETS;

export const perSheet = (preset: SheetPreset) => SHEET_PRESETS[preset].cols * SHEET_PRESETS[preset].rows;

export interface LabelTexts {
  produced: string;
  expires: string;
  noExpiry: string;
  lot: string;
}

/** 1 ดวงต่อรหัสชิ้น — codes = รหัสประจำชิ้นที่จะพิมพ์ (จาก productLotsService.pieces) */
export interface LabelJob {
  lot: ProductLot;
  codes: string[];
}

export interface PrintOptions {
  preset: SheetPreset;
  /** ดวงแรกที่จะพิมพ์บนแผ่นแรก (1 = มุมซ้ายบน) — ใช้แผ่นที่เหลือจากครั้งก่อนต่อได้ */
  startAt: number;
  locale: string;
  storeName: string;
  /** ราคา → ข้อความ (formatCurrency) */
  price: (amount: number) => string;
  texts: LabelTexts;
}

/** "2026-10-28" → "28/10/69" (th = พ.ศ.) / "28/10/26" */
export function labelDate(ymd: string, locale: string): string {
  const [y, m, d] = ymd.split("-");
  const year = locale.startsWith("th") ? Number(y) + 543 : Number(y);
  return `${d}/${m}/${String(year).slice(-2)}`;
}

/** ราคาบนฉลาก = ราคาลดถ้ามี ไม่งั้นราคาปกติ · null = ไม่มีข้อมูลราคา */
export const labelPrice = (lot: ProductLot): number | null => lot.sale_price ?? lot.product_price ?? null;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** คืน false = เบราว์เซอร์บล็อกหน้าต่างพิมพ์ */
export async function printLotLabels(jobs: LabelJob[], opts: PrintOptions): Promise<boolean> {
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return false;

  const { default: JsBarcode } = await import("jsbarcode");
  const sheet = SHEET_PRESETS[opts.preset];
  const slots = sheet.cols * sheet.rows;
  const { texts, locale } = opts;

  const barcodes = new Map<string, string>();
  const barcode = (value: string) => {
    let svg = barcodes.get(value);
    if (svg == null) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      // margin 10 = quiet zone 10 เท่าความกว้างแท่ง — ยืดเต็มกว้างดวงแล้วยังเหลือขอบว่างพอให้เครื่องยิงจับได้
      JsBarcode(el, value, { format: "CODE128", displayValue: false, margin: 10, marginTop: 0, marginBottom: 0, height: 40, width: 2 });
      el.setAttribute("preserveAspectRatio", "none");
      svg = el.outerHTML;
      barcodes.set(value, svg);
    }
    return svg;
  };

  const label = (lot: ProductLot, code: string) => {
    const price = labelPrice(lot);
    const exp = lot.expiry_date ? `${texts.expires} ${labelDate(lot.expiry_date, locale)}` : texts.noExpiry;
    return `<div class="top"><span class="store">${escapeHtml(opts.storeName)}</span>${
      price != null ? `<span class="price">${escapeHtml(opts.price(price))}</span>` : ""
    }</div>
<div class="name">${escapeHtml(lot.product_name_th ?? "")}</div>
${
  lot.product_code
    ? `<div class="code">${barcode(lot.product_code)}</div><div class="cap">${escapeHtml(lot.product_code)}</div>`
    : ""
}
<div class="code">${barcode(code)}</div><div class="cap">${escapeHtml(`${texts.lot} ${code}`)}</div>
<div class="dates"><span>${escapeHtml(`${texts.produced} ${labelDate(lot.produced_date, locale)}`)}</span><b>${escapeHtml(exp)}</b></div>`;
  };

  // ดวงว่างช่วงต้นแผ่นแรก (startAt) แล้วต่อด้วยฉลากทุกดวง → ตัดเป็นแผ่นละ slots ดวง
  const cells: ({ lot: ProductLot; code: string } | null)[] = [
    ...Array.from({ length: Math.min(Math.max(opts.startAt, 1), slots) - 1 }, () => null),
    ...jobs.flatMap(({ lot, codes }) => codes.map((code) => ({ lot, code }))),
  ];
  const pages: string[] = [];
  for (let i = 0; i < cells.length; i += slots) {
    const html = cells
      .slice(i, i + slots)
      .map((cell, k) => {
        if (!cell) return "";
        const x = sheet.left + (k % sheet.cols) * (sheet.w + sheet.gapX);
        const y = sheet.top + Math.floor(k / sheet.cols) * (sheet.h + sheet.gapY);
        return `<section class="label" style="left:${+x.toFixed(2)}mm;top:${+y.toFixed(2)}mm">${label(cell.lot, cell.code)}</section>`;
      })
      .join("\n");
    pages.push(`<div class="sheet">${html}</div>`);
  }

  // ความสูงบาร์โค้ด — ที่เหลือจากตัวหนังสือ (~22 มม.) แบ่งสองอัน · ไม่เกิน 10 มม.
  const codeH = Math.min(10, Math.max(6, (sheet.h - 22) / 2));

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(jobs.map((j) => j.lot.lot_no).join(", "))}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Sarabun", "Tahoma", sans-serif; color: #000; }
  .sheet { position: relative; width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; break-after: page; }
  .sheet:last-child { page-break-after: auto; break-after: auto; }
  .label { position: absolute; width: ${sheet.w}mm; height: ${sheet.h}mm; padding: 1.8mm 2.5mm; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
  .top { display: flex; justify-content: space-between; align-items: baseline; gap: 2mm; line-height: 1.1; }
  .store { font-size: 6.5pt; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .price { font-size: 10pt; font-weight: 700; white-space: nowrap; }
  .name { font-size: 8.5pt; font-weight: 700; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .code svg { display: block; width: 100%; height: ${codeH}mm; }
  .cap { font-family: "Consolas", "Courier New", monospace; font-size: 6.5pt; text-align: center; letter-spacing: 0.4pt; line-height: 1; }
  .dates { display: flex; justify-content: space-between; gap: 2mm; font-size: 7pt; line-height: 1.1; white-space: nowrap; }
</style></head>
<body>${pages.join("\n")}</body></html>`);
  win.document.close();
  win.onafterprint = () => win.close();
  // รอ layout/ฟอนต์ก่อนสั่งพิมพ์
  win.setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
  return true;
}
