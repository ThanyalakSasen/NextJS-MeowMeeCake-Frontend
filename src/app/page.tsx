import { redirect } from "next/navigation";
import { CUSTOMER_HOME_PATH } from "@/constants/auth";

// หน้าแรก "/" — หน้าร้านสำหรับทุกคน (proxy.ts redirect ไปก่อนแล้วเป็น 307 · ตรงนี้เป็นทางสำรอง)
// พนักงานเข้าหลังร้านผ่าน /login (พาไป /owner ตาม role) หรือ /owner ตรง ๆ
export default function Home() {
  redirect(CUSTOMER_HOME_PATH);
}
