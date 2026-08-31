// ─────────────────────────────────────────────────────────────
// src/lib/exportCsv.ts
// Export ตาราง/รายการเป็น CSV (เปิดด้วย Excel ได้ทันที) — ใช้ทุกหน้าที่มีปุ่ม Export
// (port จากระบบเดิม — client-only, ใช้ Blob + <a download>)
// ─────────────────────────────────────────────────────────────

export type ExportCell = string | number | null | undefined;

/**
 * บังคับให้ Excel มองค่าเป็น "ข้อความ" เสมอ (กันแปลงเป็นวันที่/serial แล้วโชว์ #####)
 * ใช้กับคอลัมน์วันที่/เวลาที่ format เป็น string มาแล้ว
 */
export function forceText(value: string): string {
  return `="${value}"`;
}

/**
 * สร้างและดาวน์โหลดไฟล์ CSV
 * - ครอบทุกเซลล์ด้วย double quote + escape quote ซ้อน (ปลอดภัยกับจุลภาค/ขึ้นบรรทัด)
 * - เติม UTF-8 BOM ให้ Excel อ่านภาษาไทยถูก
 */
export function exportToCsv(filename: string, headers: string[], rows: ExportCell[][]): void {
  const escapeCell = (cell: ExportCell) => `"${String(cell ?? "").replace(/"/g, '""')}"`;
  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");

  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
