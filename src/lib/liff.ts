// ─────────────────────────────────────────────────────────────
// src/lib/liff.ts
// สั่งซื้อผ่าน LINE — ลูกค้ากด Rich Menu ใน OA → เปิดหน้าร้านเป็น LIFF app ในแอป LINE (liff.line.me/<LIFF_ID>)
//   ensureLiff()      → init SDK ครั้งเดียว · คืน null ถ้าไม่ได้เปิดในแอป LINE / ไม่ได้ตั้ง NEXT_PUBLIC_LIFF_ID / init พัง
//   liffIdToken()     → id_token ส่งให้ backend POST /auth/line/liff ล็อกอินอัตโนมัติ (authClient.loginWithLiff)
//   canSendToChat()   → เปิดจากห้องแชท (Rich Menu ของ OA = "utou") ส่งข้อความในนามลูกค้าได้
//   sendToChat(text)  → liff.sendMessages — ข้อความในนามลูกค้า ไม่กินโควตา push ของ OA
// SDK (~100 KB) โหลดแบบ dynamic import เฉพาะตอนเปิดในแอป LINE — เบราว์เซอร์ปกติไม่โหลดเลย
// LIFF app ต้องสร้างใต้ LINE Login channel เดียวกับ LINE_LOGIN_CHANNEL_ID ของ backend (aud ของ id_token ต้องตรง)
// scope: openid · profile · chat_message.write · Endpoint URL = https://<โดเมน>/customer
// ─────────────────────────────────────────────────────────────
import type { Liff } from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? "";

/** แอป LINE (รวม LIFF browser) ใส่ "Line/<เวอร์ชัน>" ใน user agent */
export function isInLineApp(): boolean {
  return typeof navigator !== "undefined" && /\bLine\/\d/i.test(navigator.userAgent);
}

let liffPromise: Promise<Liff | null> | null = null;

export function ensureLiff(): Promise<Liff | null> {
  if (!LIFF_ID || !isInLineApp()) return Promise.resolve(null);
  liffPromise ??= import("@line/liff")
    .then(async ({ default: liff }) => {
      await liff.init({ liffId: LIFF_ID });
      return liff.isInClient() ? liff : null;
    })
    .catch((e) => {
      // init พัง (LIFF ID ผิด · Endpoint URL ไม่ตรงโดเมน) — หน้าร้านยังใช้ได้ปกติ ลูกค้ากดเข้าสู่ระบบด้วย LINE เองได้
      console.warn("[liff] init failed", e);
      return null;
    });
  return liffPromise;
}

export async function liffIdToken(): Promise<string | null> {
  const liff = await ensureLiff();
  return liff?.getIDToken() ?? null;
}

const CHAT_CONTEXTS = new Set(["utou", "group", "room", "square_chat"]);

export async function canSendToChat(): Promise<boolean> {
  const liff = await ensureLiff();
  const type = liff?.getContext()?.type;
  return !!type && CHAT_CONTEXTS.has(type);
}

/** ส่งข้อความเข้าห้องแชทที่เปิด LIFF มา (ในนามลูกค้า) — ลูกค้าไม่ได้ให้สิทธิ์ chat_message.write = throw */
export async function sendToChat(text: string): Promise<void> {
  const liff = await ensureLiff();
  if (!liff) throw new Error("not in LINE");
  await liff.sendMessages([{ type: "text", text }]);
}
