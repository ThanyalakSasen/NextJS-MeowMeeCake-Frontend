// ─────────────────────────────────────────────────────────────
// src/constants/enumConfig.ts
// สี / flow ของ enum ต่าง ๆ — **ไม่มีข้อความ label** (label อยู่ i18n namespace "enums")
//
// ใช้คู่ i18n:
//   const t = useTranslations("enums.orderStatus");
//   <StatusBadge color={ORDER_STATUS_CONFIG[s].antColor} label={t(s)} />
// ─────────────────────────────────────────────────────────────

/** ชื่อสีของ antd <Tag color> / <Badge status> */
export type AntColor =
  | "default" | "success" | "processing" | "warning" | "error"
  | "purple" | "orange" | "blue" | "gold";

interface StatusStyle {
  color: string;
  antColor: AntColor;
  bg?: string;
  text?: string;
}

// ─── ออเดอร์ ─────────────────────────────────────────────────
export type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending", "confirmed", "preparing", "ready", "completed",
];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusStyle> = {
  pending:   { color: "#b45309", antColor: "warning" },
  confirmed: { color: "#1d4ed8", antColor: "processing" },
  preparing: { color: "#7c3aed", antColor: "purple" },
  ready:     { color: "#c2410c", antColor: "orange" },
  completed: { color: "#15803d", antColor: "success" },
  cancelled: { color: "#dc2626", antColor: "error" },
};

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusStyle> = {
  pending:  { color: "#b45309", antColor: "warning" },
  paid:     { color: "#15803d", antColor: "success" },
  failed:   { color: "#dc2626", antColor: "error" },
  refunded: { color: "#475569", antColor: "default" },
};

// ─── การผลิต ─────────────────────────────────────────────────
export type ProductionStatus = "planned" | "in_progress" | "done" | "cancelled";

export const PRODUCTION_STATUS_FLOW: ProductionStatus[] = ["planned", "in_progress", "done"];

export const PRODUCTION_STATUS_CONFIG: Record<ProductionStatus, StatusStyle> = {
  planned:     { color: "#64748b", antColor: "default",    bg: "#f1f5f9", text: "#64748b" },
  in_progress: { color: "#1d4ed8", antColor: "processing", bg: "#dbeafe", text: "#1d4ed8" },
  done:        { color: "#15803d", antColor: "success",    bg: "#dcfce7", text: "#15803d" },
  cancelled:   { color: "#dc2626", antColor: "error",      bg: "#fee2e2", text: "#dc2626" },
};

export type ProductionItemStatus = "pending" | "in_progress" | "done" | "cancelled";

export const PRODUCTION_ITEM_STATUS_CONFIG: Record<ProductionItemStatus, StatusStyle> = {
  pending:     { color: "#f59e0b", antColor: "warning" },
  in_progress: { color: "#3b82f6", antColor: "processing" },
  done:        { color: "#22c55e", antColor: "success" },
  cancelled:   { color: "#ef4444", antColor: "error" },
};

export type SourceType = "manual" | "preorder";

export const SOURCE_TYPE_CONFIG: Record<SourceType, { color: string; bg: string }> = {
  manual:   { color: "#7c3aed", bg: "#ede9fe" },
  preorder: { color: "#1d4ed8", bg: "#dbeafe" },
};

// ─── สต็อกวัตถุดิบ ───────────────────────────────────────────
export type StockStatus = "ok" | "low" | "out";

export const STOCK_STATUS_CONFIG: Record<StockStatus, StatusStyle & { dotColor: string }> = {
  ok:  { color: "#15803d", antColor: "success", dotColor: "#22c55e", bg: "#dcfce7", text: "#15803d" },
  low: { color: "#b45309", antColor: "warning", dotColor: "#f59e0b", bg: "#fef3c7", text: "#b45309" },
  out: { color: "#dc2626", antColor: "error",   dotColor: "#ef4444", bg: "#fee2e2", text: "#dc2626" },
};

export function stockProgressColor(status: StockStatus): string {
  return STOCK_STATUS_CONFIG[status].dotColor;
}

export type IngredientTxnType = "use" | "receive" | "adjust";

export const INGREDIENT_TXN_CONFIG: Record<IngredientTxnType, { color: string; bg: string; sign: "+" | "-" }> = {
  use:     { color: "#be185d", bg: "#fce7f3", sign: "-" },
  receive: { color: "#15803d", bg: "#dcfce7", sign: "+" },
  adjust:  { color: "#b45309", bg: "#fef3c7", sign: "-" },
};

// ─── ช่องทางขาย / โปรโมชัน ───────────────────────────────────
export type SalesChannel = "online" | "walkin";

export const SALES_CHANNEL_CONFIG: Record<SalesChannel, { color: string; bg: string }> = {
  online: { color: "#1d4ed8", bg: "#dbeafe" },
  walkin: { color: "#7c3aed", bg: "#ede9fe" },
};

export type PromotionChannel = "online" | "instore";

// ─── หมวดสูตรย่อย (ค่าเก็บใน DB เป็นไทย — label มาจาก i18n enums.recipeCategory) ──
export const RECIPE_CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "เนื้อเค้ก": { bg: "#fce7f3", text: "#be185d" },
  "ครีม":      { bg: "#dbeafe", text: "#1d4ed8" },
  "ไส้":       { bg: "#d1fae5", text: "#15803d" },
  "ท็อปปิ้ง":  { bg: "#fef3c7", text: "#b45309" },
  "แป้ง":      { bg: "#ede9fe", text: "#7c3aed" },
  "อื่นๆ":     { bg: "#f1f5f9", text: "#64748b" },
};

// ─── แบนเนอร์หน้าร้าน ───────────────────────────────────────
export type BannerStatus = "active" | "scheduled" | "inactive";

export const BANNER_STATUS_CONFIG: Record<BannerStatus, StatusStyle> = {
  active:    { color: "#15803d", antColor: "success" },
  scheduled: { color: "#b45309", antColor: "warning" },
  inactive:  { color: "#64748b", antColor: "default" },
};

// ─── บันทึกการทำงานของพนักงาน (audit log) ───────────────────
export type UserLogAction = "CREATE" | "READ" | "UPDATE" | "DELETE" | "OTHER";

export const USER_LOG_ACTION_CONFIG: Record<UserLogAction, { color: string; bg: string }> = {
  CREATE: { color: "#15803d", bg: "#dcfce7" },
  READ:   { color: "#475569", bg: "#f1f5f9" },
  UPDATE: { color: "#b45309", bg: "#fef3c7" },
  DELETE: { color: "#dc2626", bg: "#fee2e2" },
  OTHER:  { color: "#7c3aed", bg: "#ede9fe" },
};

// ─── การแจ้งเตือน ───────────────────────────────────────────
export const NOTIFICATION_TYPE_COLOR: Record<"warning" | "info" | "success" | "error", string> = {
  warning: "#f59e0b",
  info:    "#3b82f6",
  success: "#22c55e",
  error:   "#ef4444",
};
