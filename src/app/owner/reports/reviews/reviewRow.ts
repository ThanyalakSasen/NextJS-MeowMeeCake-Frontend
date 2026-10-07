// แถวรีวิวที่หน้าใช้ — ดึงชื่อ/รูป/เลขออเดอร์จาก field ที่ populate · รวมหัวข้อจากลูกค้า (aspect_feedback) กับประโยคสำเร็จรูปของรีวิวเก่า
import { resolveUploadUrl } from "@/lib/uploads";
import type { Review } from "@/types/review";

export interface ReviewTopic {
  label: string;
  /** neutral = ประโยคสำเร็จรูประดับกลาง (3) */
  sentiment: "positive" | "negative" | "neutral";
}

export interface ReviewRow extends Review {
  userName: string;
  productName: string;
  productImage: string | undefined;
  /** "" = ไม่ทราบ */
  orderNo: string;
  isPreorder: boolean;
  isRead: boolean;
  internalTags: string[];
  topics: ReviewTopic[];
  images: string[];
  videoUrl: string | undefined;
}

export function toReviewRow(r: Review): ReviewRow {
  const user = r.user_id && typeof r.user_id === "object" ? r.user_id : null;
  const product = r.product_id && typeof r.product_id === "object" ? r.product_id : null;
  const order = r.order_item_id && typeof r.order_item_id === "object" ? r.order_item_id.order_id : null;
  const pre = r.preorder_order_item_id && typeof r.preorder_order_item_id === "object" ? r.preorder_order_item_id.preorder_id : null;
  const topics: ReviewTopic[] = [
    ...(r.aspect_feedback ?? []).map((f) => ({ label: f.aspect_name_th ?? "", sentiment: f.sentiment })),
    ...(r.selected_presets ?? []).map((p) => {
      const name = p.aspect_id && typeof p.aspect_id === "object" ? p.aspect_id.aspect_name_th : "";
      return {
        label: name ? `${name}: ${p.text}` : p.text,
        sentiment: p.rating_level >= 4 ? ("positive" as const) : p.rating_level <= 2 ? ("negative" as const) : ("neutral" as const),
      };
    }),
  ];
  return {
    ...r,
    userName: user?.user_fullname ?? "",
    productName: product?.product_name_th ?? "",
    productImage: resolveUploadUrl(product?.product_img ?? null),
    orderNo: order?.order_no ?? pre?.preorder_no ?? "",
    isPreorder: !!r.preorder_order_item_id,
    isRead: !!r.read_at,
    internalTags: r.internal_tags ?? [],
    topics,
    images: (r.image ?? []).map((u) => resolveUploadUrl(u)).filter((u): u is string => !!u),
    videoUrl: resolveUploadUrl(r.video ?? null),
  };
}
