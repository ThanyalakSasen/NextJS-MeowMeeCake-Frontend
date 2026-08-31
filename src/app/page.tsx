import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE, LOGIN_PATH, HOME_PATH } from "@/constants/auth";

// หน้าแรก "/" — เด้งตามว่ามี auth cookie ไหม
// (proxy.ts กัน /owner/* กับ /login อยู่แล้ว — อันนี้กันเฉพาะ "/")
export default async function Home() {
  const store = await cookies();
  redirect(store.get(AUTH_COOKIE)?.value ? HOME_PATH : LOGIN_PATH);
}
