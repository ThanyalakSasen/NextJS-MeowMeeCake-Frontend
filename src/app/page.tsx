import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE, AUTH_GATE, LOGIN_PATH, HOME_PATH } from "@/constants/auth";

// หน้าแรก "/" — เด้งตามว่ามี auth cookie ไหม
// (proxy.ts กัน /owner/* กับ /login อยู่แล้ว — อันนี้กันเฉพาะ "/")
export default async function Home() {
  // โหมด "client": มองไม่เห็น cookie ของ backend → ไปหน้าแรก แล้ว OwnerLayout เด้งไป /login เองถ้ายังไม่ login
  if (AUTH_GATE === "client") redirect(HOME_PATH);
  const store = await cookies();
  redirect(store.get(AUTH_COOKIE)?.value ? HOME_PATH : LOGIN_PATH);
}
