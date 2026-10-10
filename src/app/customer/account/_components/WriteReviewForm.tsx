"use client";
// ─────────────────────────────────────────────────────────────
// ฟอร์มเขียนรีวิว (BACKLOG3-merge D7) — ใช้ร่วมกันระหว่างออเดอร์ (purchases/[id]/review) กับพรีออเดอร์ (preorders/[id]/review)
// ยกจาก FrontOffice account/pendingreview/[id] — ต่างจากต้นแบบ:
//   - ต้นแบบมี 2 โหมด (ทีละชิ้นผ่าน ?next= · รีวิวรวม ?mode=combined) · ที่นี่หน้าเดียว: ติ๊กรายการที่จะใช้รีวิวนี้
//     (ติ๊ก 1 ชิ้น = ทีละชิ้น) ส่งแล้วรายการที่เหลือยังรีวิวต่อได้ในหน้าเดิม
//   - ส่งแบบ …_ids เสมอ (backend สร้างรีวิวแยกของแต่ละชิ้นด้วยเนื้อหาเดียวกัน) · ผ่านบางชิ้น = แสดงชิ้นที่ไม่ผ่านพร้อมเหตุผล
// แบบ Grab: ให้ดาวก่อน แล้วถามต่อ — 4-5 ดาว "ประทับใจสิ่งใด?" · 1-3 ดาว "ควรปรับปรุงตรงไหน?" (แง่มุมเป็นคำชม/คำติตามดาว)
// ไฟล์อัปโหลดก่อนส่ง · ส่งไม่ผ่านเลยสักชิ้น → ลบไฟล์ที่อัปไปแล้ว (DELETE /shop/reviews/upload)
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { CakeSlice, Send, Star, Upload, Video, X } from "lucide-react";
import { catalogService } from "@/services/catalog";
import { shopReviewsService, type ReviewKind } from "@/services/shopReviews";
import { resolveUploadUrl } from "@/lib/uploads";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import AspectIcon from "@/components/customer/AspectIcon";
import { baht, shopButton, shopButtonPrimary, shopCard } from "@/components/customer/shopStyles";
import { useReviewedItems } from "../../hooks/useReviewedItems";
import { catalogProductKey } from "../../lib/catalogQueries";
import { reviewAspectsKey, shopPointsKey, shopReviewsKey } from "../../lib/shopQueries";

const MAX_IMAGES = 5;
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 30;
const MAX_TEXT = 500;

const sentimentForRating = (rating: number) => (rating >= 4 ? "positive" : "negative");

export interface ReviewableItem {
  _id: string;
  product_id: string;
  product_name: string;
  product_name_eng?: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
}

interface Media {
  file: File;
  previewUrl: string;
}

export default function WriteReviewForm({
  kind,
  docNo,
  items,
  backHref,
}: {
  kind: ReviewKind;
  /** เลขที่ออเดอร์/พรีออเดอร์ (แสดงหัวฟอร์ม) */
  docNo: string;
  items: ReviewableItem[];
  /** หน้ารายละเอียดออเดอร์/พรีออเดอร์ — กลับไปเมื่อรีวิวครบ */
  backHref: string;
}) {
  const tw = useTranslations("shop.review");
  const { name: localName } = useLocalName();
  const tc = useTranslations("shop.common");
  const to = useTranslations("shop.orders");
  const router = useRouter();
  const qc = useQueryClient();
  const { reviewed, loaded, isError } = useReviewedItems(kind);
  const pending = items.filter((it) => !reviewed.has(it._id));

  const aspectsQ = useQuery({ queryKey: reviewAspectsKey, queryFn: shopReviewsService.aspects, staleTime: 10 * 60_000 });
  const aspects = aspectsQ.data ?? [];

  // รูปสินค้า (snapshot ในออเดอร์ไม่มีรูป) — cache เดียวกับหน้ารายละเอียดสินค้า · สินค้าถูกซ่อน (404) = ไอคอนแทน
  const productIds = [...new Set(items.map((it) => it.product_id).filter(Boolean))];
  const productQs = useQueries({
    queries: productIds.map((id) => ({ queryKey: catalogProductKey(id), queryFn: () => catalogService.product(id), retry: false, staleTime: 5 * 60_000 })),
  });
  const imageOf = (productId: string) => resolveUploadUrl(productQs[productIds.indexOf(productId)]?.data?.product_img?.[0]);

  // ติ๊กไว้ = ใช้รีวิวนี้ · ค่าเริ่มต้นทุกรายการที่ยังไม่รีวิว (unchecked เก็บแทน checked → รายการที่โหลดทีหลังติ๊กให้เอง)
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const targets = pending.filter((it) => !unchecked.has(it._id));

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [aspectIds, setAspectIds] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<Media[]>([]);
  const [video, setVideo] = useState<Media | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // object URL ของพรีวิวที่ยังไม่ revoke — ล้างตอนออกจากหน้า
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const toMedia = (file: File): Media => {
    const previewUrl = URL.createObjectURL(file);
    previews.current.add(previewUrl);
    return { file, previewUrl };
  };
  const dropMedia = (m: Media | null) => {
    if (!m) return;
    URL.revokeObjectURL(m.previewUrl);
    previews.current.delete(m.previewUrl);
  };

  const shown = hover || rating;
  const sentiment = sentimentForRating(rating);

  const changeRating = (star: number) => {
    // ข้ามเกณฑ์คำชม ↔ คำติ = คำถามเปลี่ยน → ล้างแง่มุมที่เลือกไว้
    if (rating > 0 && sentimentForRating(star) !== sentiment) setAspectIds([]);
    setRating(star);
  };
  const toggleAspect = (id: string) => setAspectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleItem = (id: string) =>
    setUnchecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const accepted: Media[] = [];
    for (const file of files) {
      if (images.length + accepted.length >= MAX_IMAGES) {
        alert.warning(tw("maxImages", { n: MAX_IMAGES }));
        break;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        alert.warning(tw("imageTooBig", { name: file.name, mb: MAX_IMAGE_MB }));
        continue;
      }
      accepted.push(toMedia(file));
    }
    if (accepted.length) setImages((prev) => [...prev, ...accepted]);
  };
  const removeImage = (m: Media) => {
    dropMedia(m);
    setImages((prev) => prev.filter((x) => x !== m));
  };
  const pickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert.warning(tw("videoTooBig", { mb: MAX_VIDEO_MB }));
      return;
    }
    dropMedia(video);
    setVideo(toMedia(file));
  };
  const removeVideo = () => {
    dropMedia(video);
    setVideo(null);
  };

  const resetForm = () => {
    setRating(0);
    setAspectIds([]);
    setComment("");
    images.forEach(dropMedia);
    setImages([]);
    removeVideo();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert.warning(tw("needRating"));
    if (targets.length === 0) return alert.warning(tw("needItem"));

    setSubmitting(true);
    // ไฟล์ที่อัปสำเร็จในรอบนี้ — ส่งรีวิวไม่ผ่านเลยสักชิ้นต้องลบทิ้ง ไม่ให้ค้างบน server
    let uploaded: string[] = [];
    try {
      const uploads = await Promise.allSettled([
        ...images.map((m) => shopReviewsService.upload(m.file, "image")),
        ...(video ? [shopReviewsService.upload(video.file, "video")] : []),
      ]);
      uploaded = uploads.flatMap((u) => (u.status === "fulfilled" ? [u.value] : []));
      const uploadFailed = uploads.find((u): u is PromiseRejectedResult => u.status === "rejected");
      if (uploadFailed) throw uploadFailed.reason;

      const { failed } = await shopReviewsService.create({
        kind,
        itemIds: targets.map((t) => t._id),
        rating,
        review_text: comment.trim() || undefined,
        image: images.length ? uploaded.slice(0, images.length) : undefined,
        video: video ? uploaded[images.length] : undefined,
        aspect_feedback: aspectIds.length ? aspectIds.map((aspect_id) => ({ aspect_id, sentiment })) : undefined,
      });
      // มีรีวิวอ้างถึงไฟล์แล้วอย่างน้อย 1 ชิ้น — ห้ามลบ
      uploaded = [];

      const productIdsDone = targets.filter((t) => !failed.some((f) => f.item_id === t._id)).map((t) => t.product_id);
      await qc.invalidateQueries({ queryKey: shopReviewsKey });
      void qc.invalidateQueries({ queryKey: shopPointsKey });
      for (const pid of new Set(productIdsDone)) void qc.invalidateQueries({ queryKey: [...catalogProductKey(pid), "reviews"] });

      if (failed.length > 0) {
        const nameOf = (id: string) => targets.find((t) => t._id === id)?.product_name ?? tw("product");
        setUnchecked(new Set(pending.filter((it) => !failed.some((f) => f.item_id === it._id)).map((it) => it._id)));
        alert.error(
          tw("partialFail", {
            ok: targets.length - failed.length,
            failed: failed.length,
            list: failed.map((f) => `${nameOf(f.item_id)} (${f.message})`).join(", "),
          }),
        );
        return;
      }

      const remaining = pending.length - targets.length;
      if (remaining > 0) {
        resetForm();
        setUnchecked(new Set());
        alert.success(tw("thanksRemaining", { n: remaining }));
        return;
      }
      alert.success(tw("thanks"));
      router.push(backHref);
    } catch (err) {
      void shopReviewsService.discardUploads(uploaded);
      alert.error(isApiError(err) ? err.message : tw("sendFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (isError) return <ReviewNotice text={tw("loadFailed")} href={backHref} link={to("backToDetail")} />;
  if (!loaded) return <ReviewLoading />;
  if (pending.length === 0) {
    return <ReviewNotice text={tw("allDone")} href={backHref} link={to("backToDetail")} />;
  }

  return (
    <form onSubmit={submit} className={`${shopCard} space-y-6`}>
      <div className="space-y-3 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-lg font-bold sm:text-xl">{tw("title")}</h1>
          <p className="text-sm text-stone-500">
            {kind === "preorder" ? tw("preorderNo", { no: docNo }) : tw("orderNo", { no: docNo })}
            {pending.length > 1 && tw("pickHint")}
          </p>
        </div>
        <div className="space-y-2">
          {pending.map((it) => {
            const checked = !unchecked.has(it._id);
            const img = imageOf(it.product_id);
            const body = (
              <>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#FAF6F0] text-[#8C5A3C]">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- รูปจาก backend คนละ origin
                    <img src={img} alt={it.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <CakeSlice className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-semibold text-stone-800">{localName(it.product_name, it.product_name_eng) || tw("product")}</p>
                  <p className="m-0 truncate text-xs text-stone-500">
                    {it.variant_name ? tw("option", { name: it.variant_name }) : ""}×{it.quantity} · {baht(it.unit_price)}
                  </p>
                </div>
              </>
            );
            return pending.length > 1 ? (
              <label
                key={it._id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition ${
                  checked ? "border-[#4A342E] bg-[#4A342E]/5" : "border-stone-200 hover:bg-stone-50"
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggleItem(it._id)} className="h-4 w-4 shrink-0 accent-[#4A342E]" />
                {body}
              </label>
            ) : (
              <div key={it._id} className="flex items-center gap-3">{body}</div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 py-2">
        <span className="text-sm font-semibold text-stone-700">{shown > 0 ? tw("rateValue", { n: shown }) : tw("rate")}</span>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= shown;
            return (
              <button
                key={star}
                type="button"
                className="p-0.5"
                aria-label={tw("stars", { n: star })}
                aria-pressed={star === rating}
                onClick={() => changeRating(star)}
                onMouseEnter={() => setHover(star)}
              >
                <Star size={36} fill={active ? "#FFC107" : "none"} stroke={active ? "#FFC107" : "#CCCCCC"} />
              </button>
            );
          })}
        </div>
        {shown > 0 ? (
          <span className="text-sm font-medium text-[#4A342E]">{tw(`rating.${shown as 1 | 2 | 3 | 4 | 5}`)}</span>
        ) : (
          <span className="text-xs text-stone-400">{tw("tapToRate")}</span>
        )}
      </div>

      {rating > 0 && aspects.length > 0 && (
        <div className="space-y-3 border-t border-stone-100 pt-5 text-center">
          <h3 className="text-sm font-bold text-stone-800">{sentiment === "positive" ? tw("liked") : tw("improve")}</h3>
          <p className="text-xs text-stone-400">{tw("multiOptional")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {aspects.map((a) => {
              const selected = aspectIds.includes(a._id);
              return (
                <button
                  key={a._id}
                  type="button"
                  title={a.placeholder_text ?? undefined}
                  aria-pressed={selected}
                  onClick={() => toggleAspect(a._id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition ${
                    selected ? "border-[#4A342E] bg-[#4A342E] text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                  }`}
                >
                  <AspectIcon icon={a.icon} size={14} />
                  {localName(a.aspect_name_th, a.aspect_name_eng)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-stone-100 pt-5">
        <h3 className="text-sm font-bold text-stone-800">{tw("writeMore")}</h3>
        <textarea
          className="w-full rounded-xl border border-[#8C5A3C]/25 bg-white px-3.5 py-2.5 text-sm text-[#4A342E] outline-none transition placeholder:text-gray-500 focus:border-[#8C5A3C] focus:ring-2 focus:ring-[#8C5A3C]/20"
          rows={4}
          maxLength={MAX_TEXT}
          placeholder={tw("placeholder")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <p className="m-0 text-right text-xs text-stone-400">{comment.length}/{MAX_TEXT}</p>

        <MediaButton icon={<Upload size={16} />} disabled={images.length >= MAX_IMAGES}
          label={tw("attachImages", { n: images.length, max: MAX_IMAGES })}>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
            disabled={images.length >= MAX_IMAGES} onChange={addImages} />
        </MediaButton>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((m, i) => (
              <Preview key={m.previewUrl} onRemove={() => removeImage(m)} label={tw("removeImage", { n: i + 1 })}>
                {/* eslint-disable-next-line @next/next/no-img-element -- object URL ก่อนอัปโหลด */}
                <img src={m.previewUrl} alt={tw("imageAlt", { n: i + 1 })} className="h-full w-full object-cover" />
              </Preview>
            ))}
          </div>
        )}

        <MediaButton icon={<Video size={16} />} disabled={!!video} label={tw("attachVideo", { n: video ? 1 : 0, mb: MAX_VIDEO_MB })}>
          <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" disabled={!!video} onChange={pickVideo} />
        </MediaButton>
        {video && (
          <Preview onRemove={removeVideo} label={tw("removeVideo")} large>
            <video src={video.previewUrl} className="h-full w-full object-cover" muted />
          </Preview>
        )}
        <p className="m-0 text-xs text-stone-400">{tw("pointsHint")}</p>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Link href={backHref} className={shopButton}>{tc("cancel")}</Link>
        <button type="submit" disabled={submitting || targets.length === 0} className={shopButtonPrimary}>
          <Send size={16} />
          {submitting ? tw("sending") : targets.length > 1 ? tw("sendMany", { n: targets.length }) : tw("send")}
        </button>
      </div>
    </form>
  );
}

/** ข้อความแทนฟอร์ม (ไม่พบเอกสาร · ยังรีวิวไม่ได้) + ลิงก์กลับ — หน้า review ของออเดอร์/พรีออเดอร์ใช้ร่วมกัน */
export function ReviewNotice({ text, href, link }: { text: string; href: string; link: string }) {
  return (
    <div className={`${shopCard} space-y-4 text-center`}>
      <p className="font-bold">{text}</p>
      <Link href={href} className={shopButton}>{link}</Link>
    </div>
  );
}

export function ReviewLoading() {
  const tc = useTranslations("shop.common");
  return (
    <div className={`${shopCard} flex justify-center py-12`}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label={tc("loading")} />
    </div>
  );
}

function MediaButton({ icon, label, disabled, children }: { icon: React.ReactNode; label: string; disabled: boolean; children: React.ReactNode }) {
  return (
    <label
      className={`mr-2 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition ${
        disabled ? "cursor-not-allowed border-stone-200 text-stone-300" : "cursor-pointer border-stone-300 text-stone-600 hover:bg-stone-50"
      }`}
    >
      {icon}
      <span>{label}</span>
      {children}
    </label>
  );
}

function Preview({ onRemove, label, large, children }: { onRemove: () => void; label: string; large?: boolean; children: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-stone-200 ${large ? "h-28 w-28" : "h-16 w-16"}`}>
      {children}
      <button type="button" onClick={onRemove} aria-label={label}
        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
        <X size={12} />
      </button>
    </div>
  );
}
