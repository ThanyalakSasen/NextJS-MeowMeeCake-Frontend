import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// /customer/order/[id] (path เดิม) → /customer/account/purchases/[id]
// ตัดสิน BACKLOG3-merge G1 = path แบบ FrontOffice (ลิงก์ในกระดิ่ง/LINE ของ backend ชี้ไปที่นั่น) · คงไว้ให้ลิงก์เก่าใช้ได้
// ─────────────────────────────────────────────────────────────
export default async function LegacyOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === "string") qs.set(k, v);
  const query = qs.toString();
  redirect(`/customer/account/purchases/${encodeURIComponent(id)}${query ? `?${query}` : ""}`);
}
