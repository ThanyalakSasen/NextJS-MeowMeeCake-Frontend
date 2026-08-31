// ─────────────────────────────────────────────────────────────
// src/i18n/messages.d.ts
// บอก TypeScript ว่า t("...") มี key อะไรได้บ้าง (จาก en.json)
// ผล: พิมพ์ t(" แล้ว editor ขึ้น autocomplete · พิมพ์ key ผิด = build error (ไม่ใช่รอ runtime)
// ─────────────────────────────────────────────────────────────
import type messages from "@/i18n/messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
