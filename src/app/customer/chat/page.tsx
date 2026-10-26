import ChatPage from "./_components/ChatPage";

// /customer/chat — แชทกับร้าน (เต็มจอ) · ?order=<id> / ?preorder=<id> = เลือกคำสั่งซื้อนั้นแนบไว้ให้ก่อน
// (ปุ่ม "สอบถามร้านเรื่องคำสั่งซื้อนี้" ในหน้ารายละเอียดคำสั่งซื้อ) — อ่าน searchParams ฝั่ง server แทน useSearchParams
export default async function CustomerChatRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" && /^[a-f\d]{24}$/i.test(v) ? v : null);
  const order = one(sp.order);
  const preorder = one(sp.preorder);
  const initialAttach = order ? { kind: "order" as const, id: order } : preorder ? { kind: "preorder" as const, id: preorder } : null;
  return <ChatPage initialAttach={initialAttach} />;
}
