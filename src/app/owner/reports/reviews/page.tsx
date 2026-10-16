import ReviewsPageClient from "./ReviewsPageClient";

// แท็บ sync กับ ?tab= (ไม่ระบุ = จัดการรีวิว) — อ่านฝั่ง server แล้วส่งเป็น prop (render ฝั่ง server ได้ทั้งหน้า · OwnerLayout SSR_PAGES)
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const tab = (await searchParams).tab === "dashboard" ? "dashboard" : "manage";
  return <ReviewsPageClient tab={tab} />;
}
