"use client";
// งบกำไร-ขาดทุน — แถวสไตล์ต่างกันตาม kind (header/line/subtotal/gross/net) — presentational ล้วน
import { useLocale } from "next-intl";
import { formatCurrency } from "@/i18n/format";
import type { PnLRow } from "../useFinanceSummaryViewModel";

const ROW_STYLE: Record<PnLRow["kind"], string> = {
  header: "text-sm font-semibold uppercase tracking-wider text-gray-400",
  line: "pl-3 text-sm text-gray-600",
  subtotal: "text-sm font-semibold text-gray-700",
  gross: "text-sm font-semibold text-green-700",
  net: "text-base font-bold text-blue-700",
};

const ROW_BG: Record<PnLRow["kind"], string> = {
  header: "",
  line: "",
  subtotal: "bg-gray-50",
  gross: "bg-green-50",
  net: "bg-blue-50",
};

function amountColor(row: PnLRow): string {
  if (row.kind === "net") return "#1d4ed8";
  if (row.kind === "gross") return "#16a34a";
  if (row.key.startsWith("cogs_") || row.key.startsWith("opex_") || row.key === "total_cogs" || row.key === "total_opex") return "#ef4444";
  return "#16a34a";
}

export function PLStatementTable({ rows }: { rows: PnLRow[] }) {
  const locale = useLocale();

  return (
    <div className="flex flex-col">
      {rows.map((row) => {
        const isSectionHeader = row.kind === "header";
        return (
          <div key={row.key} className={`flex items-center justify-between px-4 py-1.5 ${ROW_BG[row.kind]}`}>
            <span className={ROW_STYLE[row.kind]}>{row.label}</span>
            {!isSectionHeader && (
              <span className={row.kind === "net" ? "text-base font-bold" : "text-sm font-semibold"} style={{ color: amountColor(row) }}>
                {formatCurrency(row.amount, locale)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
