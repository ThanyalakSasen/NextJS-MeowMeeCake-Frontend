// ─────────────────────────────────────────────────────────────
// src/i18n/keys.ts
// type ของ key ในแต่ละ namespace — ใช้ตอน key มาจาก config/data (ไม่ใช่ literal)
// เช่น menu labelKey, breadcrumb → typescript จะเช็คให้ว่า key มีจริง
// ─────────────────────────────────────────────────────────────
import en from "@/i18n/messages/en.json";

export type NavKey = keyof (typeof en)["nav"];
export type EnumGroup = keyof (typeof en)["enums"];
