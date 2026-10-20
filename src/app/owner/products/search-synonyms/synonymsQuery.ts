// query key ของกลุ่มคำพ้อง — ใช้ร่วมกันระหว่าง ViewModel กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
export const SYNONYMS_KEY = ["search-synonyms"] as const;
