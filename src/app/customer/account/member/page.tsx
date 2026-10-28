import MemberPage from "./_components/MemberPage";
import { isMemberTab } from "./_components/memberTabs";

// /customer/account/member — แท็บอ่านจาก ?tab= ฝั่ง server (ไม่ใช้ useSearchParams — ไม่ต้องห่อ Suspense)
// coupons (ค่าเริ่มต้น) · redeem · history · earn
export default async function MemberRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const tab = (await searchParams).tab;
  return <MemberPage initialTab={isMemberTab(tab) ? tab : "coupons"} />;
}
