// ─────────────────────────────────────────────────────────────
// prefetchPublic — ดึงข้อมูลสาธารณะของหน้าร้าน (/catalog/*) ตอน render ฝั่ง server แล้วส่งต่อให้ react-query ฝั่ง browser
// (HydrationBoundary) — ใช้ service + query key เดียวกับหน้า จึงได้ข้อมูลรูปแบบเดียวกันเป๊ะ ไม่ยิงซ้ำตอนเปิดหน้า
//
// ทำไม: เดิมข้อมูลโหลดหลัง JS ทำงานเสร็จเท่านั้น → รูปหลักของหน้า (แบนเนอร์ · รูปสินค้า) เริ่มโหลดช้า
// (Lighthouse มือถือ LCP ~5 วิ) · ตอนนี้ HTML แรกมีสินค้า/แบนเนอร์พร้อมรูปแล้ว
//
// http ฝั่ง server ใช้ fetch ของ Next แคช 60 วิ (src/lib/http.ts) — เปิดหน้าซ้ำไม่ต้องรอ backend
// รอไม่เกิน PREFETCH_TIMEOUT_MS ต่อชุด: backend ช้า/ตื่นจากหลับ (Render ฟรี ~50 วิ) → ส่งหน้าไปก่อน
// แล้ว browser ดึงเองเหมือนเดิม (query ที่ไม่สำเร็จไม่ถูกส่งไป) · error ไม่ทำให้หน้าพัง (prefetchQuery กลืน error เอง)
// ─────────────────────────────────────────────────────────────
import { QueryClient, dehydrate, type DehydratedState, type QueryKey } from "@tanstack/react-query";

const PREFETCH_TIMEOUT_MS = 2500;

export interface PublicPrefetch {
  queryKey: QueryKey;
  queryFn: () => Promise<unknown>;
}

export async function prefetchPublic(entries: PublicPrefetch[]): Promise<DehydratedState> {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, PREFETCH_TIMEOUT_MS));
  await Promise.race([Promise.all(entries.map((e) => qc.prefetchQuery(e))), timeout]);
  return dehydrate(qc);
}
