"use client";
// ─────────────────────────────────────────────────────────────
// ฟอร์มเขียนรีวิว (BACKLOG3-merge D7) — ใช้ร่วมกันระหว่างออเดอร์ (purchases/[id]/review) กับพรีออเดอร์ (preorders/[id]/review)
// ยกจาก FrontOffice account/pendingreview/[id] — ต่างจากต้นแบบ:
//   - หลายชิ้น = ถามก่อน: "รีวิวทั้งหมดพร้อมกัน" = หน้าเดียวยาว ๆ ทุกชิ้นมีดาว/แง่มุม/ข้อความ/รูปของตัวเอง ส่งทีเดียว
//     (ไม่มีช่องติ๊กเลือกสินค้า · 2026-10-27) หรือ "รีวิวทีละชิ้น" (ฟอร์มทีละชิ้น ส่งแล้วไปชิ้นถัดไปเอง · บอก "ชิ้นที่ x จาก n")
//     · เปลี่ยนวิธีได้ระหว่างทาง · ชิ้นเดียว = ไม่ถาม
//   - ส่งทีละชิ้น (…_ids 1 รายการ) — ชิ้นที่ไม่ผ่านยังอยู่ในฟอร์มพร้อมเหตุผล ชิ้นที่ผ่านหายไปจากฟอร์ม
// แบบ Grab: ให้ดาวก่อน แล้วถามต่อ — 4-5 ดาว "ประทับใจสิ่งใด?" · 1-3 ดาว "ควรปรับปรุงตรงไหน?" (แง่มุมเป็นคำชม/คำติตามดาว)
// ไฟล์อัปโหลดก่อนส่ง · ชิ้นไหนส่งไม่ผ่าน → ลบไฟล์ของชิ้นนั้นที่อัปไปแล้ว (DELETE /shop/reviews/upload)
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { CakeSlice, Layers, ListOrdered, Send, Star, Upload, Video, X } from "lucide-react";
import { catalogService } from "@/services/catalog";
import { shopReviewsService, type ReviewKind } from "@/services/shopReviews";
import type { ReviewAspect } from "@/services/shopReviews";
import { resolveUploadUrl } from "@/lib/uploads";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import AspectIcon from "@/components/customer/AspectIcon";
import { baht, shopButton, shopButtonPrimary, shopCard } from "@/components/customer/shopStyles";
import { useReviewedItems } from "../../hooks/useReviewedItems";
import { catalogProductKey } from "../../lib/catalogQueries";
import { reviewAspectsKey, shopPointsKey, shopReviewsKey } from "../../lib/shopQueries";
import ShopImage from "@/components/customer/ShopImage";
import ShopSpinner from "@/components/customer/ShopSpinner";

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

interface MediaHelpers {
  make: (file: File) => Media;
  drop: (m: Media | null) => void;
}

/** เนื้อหารีวิวของสินค้า 1 ชิ้น */
interface Draft {
  rating: number;
  aspectIds: string[];
  comment: string;
  images: Media[];
  video: Media | null;
}

const EMPTY_DRAFT: Draft = { rating: 0, aspectIds: [], comment: "", images: [], video: null };

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

  // วิธีรีวิวเมื่อมีหลายชิ้น — null = ยังไม่เลือก (ถามก่อน) · ชิ้นเดียว = รีวิวชิ้นนั้นเลย
  const [mode, setMode] = useState<"all" | "one" | null>(null);
  const allAtOnce = pending.length > 1 && mode === "all";
  // ทีละชิ้น: นับลำดับจากจำนวนที่ยังไม่รีวิวตอนเริ่ม (ส่งแล้ว pending สั้นลง → ชิ้นถัดไป)
  const [startCount, setStartCount] = useState(0);
  // แบบรวม = ทุกชิ้นที่ยังไม่รีวิวในหน้าเดียว · ทีละชิ้น/ชิ้นเดียว = ชิ้นแรกที่ยังไม่รีวิว
  const targets = allAtOnce ? pending : pending.slice(0, 1);

  // เนื้อหารีวิวแยกต่อชิ้น (key = item _id)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draftOf = (id: string) => drafts[id] ?? EMPTY_DRAFT;
  const patchDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_DRAFT), ...patch } }));
  const [submitting, setSubmitting] = useState(false);

  // object URL ของพรีวิวที่ยังไม่ revoke — ล้างตอนออกจากหน้า
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const media: MediaHelpers = {
    make: (file) => {
      const previewUrl = URL.createObjectURL(file);
      previews.current.add(previewUrl);
      return { file, previewUrl };
    },
    drop: (m) => {
      if (!m) return;
      URL.revokeObjectURL(m.previewUrl);
      previews.current.delete(m.previewUrl);
    },
  };
  /** ล้างเนื้อหาของชิ้นที่ระบุ (ไม่ระบุ = ทุกชิ้น) + คืน object URL */
  const clearDrafts = (ids: string[] = Object.keys(drafts)) => {
    for (const id of ids) {
      drafts[id]?.images.forEach(media.drop);
      media.drop(drafts[id]?.video ?? null);
    }
    setDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !ids.includes(id))));
  };

  /** ส่งรีวิวของ 1 ชิ้น — คืนข้อความผิดพลาด (null = สำเร็จ) · ไม่สำเร็จ = ลบไฟล์ที่อัปไปแล้วของชิ้นนั้น */
  const submitOne = async (it: ReviewableItem, d: Draft): Promise<string | null> => {
    let uploaded: string[] = [];
    try {
      const uploads = await Promise.allSettled([
        ...d.images.map((m) => shopReviewsService.upload(m.file, "image")),
        ...(d.video ? [shopReviewsService.upload(d.video.file, "video")] : []),
      ]);
      uploaded = uploads.flatMap((u) => (u.status === "fulfilled" ? [u.value] : []));
      const uploadFailed = uploads.find((u): u is PromiseRejectedResult => u.status === "rejected");
      if (uploadFailed) throw uploadFailed.reason;

      const sentiment = sentimentForRating(d.rating);
      const { failed } = await shopReviewsService.create({
        kind,
        itemIds: [it._id],
        rating: d.rating,
        review_text: d.comment.trim() || undefined,
        image: d.images.length ? uploaded.slice(0, d.images.length) : undefined,
        video: d.video ? uploaded[d.images.length] : undefined,
        aspect_feedback: d.aspectIds.length ? d.aspectIds.map((aspect_id) => ({ aspect_id, sentiment })) : undefined,
      });
      if (failed.length > 0) throw new Error(failed[0].message);
      return null;
    } catch (err) {
      void shopReviewsService.discardUploads(uploaded);
      if (isApiError(err)) return err.message;
      return err instanceof Error && err.message ? err.message : tw("sendFailed");
    }
  };

  const nameOf = (it: ReviewableItem) => localName(it.product_name, it.product_name_eng) || tw("product");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targets.length === 0) return;
    const missing = targets.find((it) => draftOf(it._id).rating === 0);
    if (missing) {
      if (!allAtOnce) return alert.warning(tw("needRating"));
      document.getElementById(`review-item-${missing._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return alert.warning(tw("needRatingEach", { name: nameOf(missing) }));
    }

    setSubmitting(true);
    try {
      // ส่งทีละชิ้นตามลำดับ — ไม่อัปโหลดรูป/วิดีโอของทุกชิ้นพร้อมกัน
      const failed: { item: ReviewableItem; message: string }[] = [];
      const done: ReviewableItem[] = [];
      for (const it of targets) {
        const message = await submitOne(it, draftOf(it._id));
        if (message) failed.push({ item: it, message });
        else done.push(it);
      }

      if (done.length > 0) {
        clearDrafts(done.map((it) => it._id));
        await qc.invalidateQueries({ queryKey: shopReviewsKey });
        void qc.invalidateQueries({ queryKey: shopPointsKey });
        for (const pid of new Set(done.map((it) => it.product_id))) void qc.invalidateQueries({ queryKey: [...catalogProductKey(pid), "reviews"] });
      }

      if (failed.length > 0) {
        const list = failed.map((f) => `${nameOf(f.item)} (${f.message})`).join(", ");
        alert.error(done.length > 0 ? tw("partialFail", { ok: done.length, failed: failed.length, list }) : list);
        return;
      }

      const remaining = pending.length - done.length;
      if (remaining > 0) {
        alert.success(tw("thanksNext", { n: remaining }));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      alert.success(tw("thanks"));
      router.push(backHref);
    } finally {
      setSubmitting(false);
    }
  };

  if (isError) return <ReviewNotice text={tw("loadFailed")} href={backHref} link={to("backToDetail")} />;
  if (!loaded) return <ReviewLoading />;
  if (pending.length === 0) {
    return <ReviewNotice text={tw("allDone")} href={backHref} link={to("backToDetail")} />;
  }

  const docLabel = kind === "preorder" ? tw("preorderNo", { no: docNo }) : tw("orderNo", { no: docNo });

  // หลายชิ้น + ยังไม่เลือกวิธี → ถามก่อน
  if (pending.length > 1 && mode === null) {
    const choice = (value: "all" | "one", Icon: typeof Layers, title: string, desc: string) => (
      <button
        type="button"
        onClick={() => {
          setMode(value);
          setStartCount(pending.length);
        }}
        className="flex w-full items-start gap-3 rounded-2xl border-2 border-[#8C5A3C]/20 bg-white p-4 text-left transition hover:border-[#8C5A3C] hover:bg-[#FAF6F0]"
      >
        <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#8C5A3C]" aria-hidden="true" />
        <span>
          <span className="block text-base font-bold text-[#4A342E]">{title}</span>
          <span className="block text-sm text-stone-600">{desc}</span>
        </span>
      </button>
    );
    return (
      <div className={`${shopCard} space-y-4`}>
        <div>
          <h1 className="m-0 text-lg font-bold sm:text-xl">{tw("title")}</h1>
          <p className="m-0 text-sm text-stone-500">
            {docLabel} · {tw("itemsToReview", { n: pending.length })}
          </p>
        </div>
        <p className="m-0 text-sm font-semibold text-stone-800">{tw("askMode")}</p>
        {choice("all", Layers, tw("modeAll"), tw("modeAllDesc", { n: pending.length }))}
        {choice("one", ListOrdered, tw("modeOne"), tw("modeOneDesc"))}
      </div>
    );
  }

  const itemHeader = (it: ReviewableItem, index?: number) => {
    const img = imageOf(it.product_id);
    return (
      <div className="flex items-center gap-3">
        {index !== undefined && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4A342E] text-xs font-bold text-white">{index}</span>
        )}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#FAF6F0] text-[#8C5A3C]">
          {img ? (
            <ShopImage src={img} alt={it.product_name} width={96} height={96} sizes="48px" className="h-full w-full object-cover" />
          ) : (
            <CakeSlice className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold text-stone-800">{nameOf(it)}</p>
          <p className="m-0 truncate text-xs text-stone-500">
            {it.variant_name ? tw("option", { name: it.variant_name }) : ""}×{it.quantity} · {baht(it.unit_price)}
          </p>
        </div>
      </div>
    );
  };

  const fieldsFor = (it: ReviewableItem) => (
    <ReviewFields
      key={it._id}
      draft={draftOf(it._id)}
      onChange={(patch) => patchDraft(it._id, patch)}
      aspects={aspects}
      media={media}
    />
  );

  return (
    <form onSubmit={submit} className={`${shopCard} space-y-6`}>
      <div className="space-y-3 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-lg font-bold sm:text-xl">{tw("title")}</h1>
          <p className="text-sm text-stone-500">
            {docLabel}
            {allAtOnce && ` · ${tw("itemsToReview", { n: pending.length })}`}
          </p>
          {pending.length > 1 && (
            <p className="m-0 mt-1 flex flex-wrap items-center gap-2 text-sm">
              {!allAtOnce && (
                <span className="rounded-full bg-[#4A342E] px-2.5 py-0.5 text-xs font-bold text-white">
                  {tw("stepOf", { i: Math.max(1, startCount - pending.length + 1), n: Math.max(startCount, pending.length) })}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  clearDrafts();
                  setMode(null);
                }}
                className="text-xs font-semibold text-[#8C5A3C] underline-offset-2 hover:underline"
              >
                {tw("changeMode")}
              </button>
            </p>
          )}
        </div>
        {!allAtOnce && targets[0] && itemHeader(targets[0])}
      </div>

      {allAtOnce ? (
        // แบบรวม: ทุกชิ้นเรียงลงมาในหน้าเดียว แต่ละชิ้นมีฟอร์มของตัวเอง (ไม่มีช่องติ๊กเลือกสินค้า)
        <div className="space-y-6">
          {targets.map((it, i) => (
            <section
              key={it._id}
              id={`review-item-${it._id}`}
              aria-label={nameOf(it)}
              className={`scroll-mt-24 space-y-4 ${i > 0 ? "border-t-2 border-dashed border-[#8C5A3C]/15 pt-6" : ""}`}
            >
              {itemHeader(it, i + 1)}
              {fieldsFor(it)}
            </section>
          ))}
        </div>
      ) : (
        targets[0] && fieldsFor(targets[0])
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4">
        <Link href={backHref} className={shopButton}>{tc("cancel")}</Link>
        <button type="submit" disabled={submitting || targets.length === 0} className={shopButtonPrimary}>
          <Send size={16} />
          {submitting ? tw("sending") : allAtOnce ? tw("sendAll", { n: targets.length }) : tw("send")}
        </button>
      </div>
    </form>
  );
}

/** ดาว · แง่มุม · ข้อความ · รูป/วิดีโอ ของสินค้า 1 ชิ้น (ค่าอยู่ที่ฟอร์มหลัก — draft/onChange) */
function ReviewFields({
  draft,
  onChange,
  aspects,
  media,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  aspects: ReviewAspect[];
  media: MediaHelpers;
}) {
  const tw = useTranslations("shop.review");
  const { name: localName } = useLocalName();
  const [hover, setHover] = useState(0);
  const { rating, aspectIds, comment, images, video } = draft;
  const shown = hover || rating;
  const sentiment = sentimentForRating(rating);

  // ข้ามเกณฑ์คำชม ↔ คำติ = คำถามเปลี่ยน → ล้างแง่มุมที่เลือกไว้
  const changeRating = (star: number) =>
    onChange(rating > 0 && sentimentForRating(star) !== sentiment ? { rating: star, aspectIds: [] } : { rating: star });
  const toggleAspect = (id: string) =>
    onChange({ aspectIds: aspectIds.includes(id) ? aspectIds.filter((x) => x !== id) : [...aspectIds, id] });

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
      accepted.push(media.make(file));
    }
    if (accepted.length) onChange({ images: [...images, ...accepted] });
  };
  const removeImage = (m: Media) => {
    media.drop(m);
    onChange({ images: images.filter((x) => x !== m) });
  };
  const pickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert.warning(tw("videoTooBig", { mb: MAX_VIDEO_MB }));
      return;
    }
    media.drop(video);
    onChange({ video: media.make(file) });
  };
  const removeVideo = () => {
    media.drop(video);
    onChange({ video: null });
  };

  return (
    <div className="space-y-5">
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
          <span className="text-xs text-stone-500">{tw("tapToRate")}</span>
        )}
      </div>

      {rating > 0 && aspects.length > 0 && (
        <div className="space-y-3 border-t border-stone-100 pt-5 text-center">
          <h3 className="text-sm font-bold text-stone-800">{sentiment === "positive" ? tw("liked") : tw("improve")}</h3>
          <p className="text-xs text-stone-500">{tw("multiOptional")}</p>
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
                  className={`inline-flex h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${
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
          onChange={(e) => onChange({ comment: e.target.value })}
        />
        <p className="m-0 text-right text-xs text-stone-500">{comment.length}/{MAX_TEXT}</p>

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
        <p className="m-0 text-xs text-stone-500">{tw("pointsHint")}</p>
      </div>
    </div>
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
      <ShopSpinner label={tc("loading")} />
    </div>
  );
}

function MediaButton({ icon, label, disabled, children }: { icon: React.ReactNode; label: string; disabled: boolean; children: React.ReactNode }) {
  return (
    <label
      className={`mr-2 inline-flex h-[44px] items-center gap-2 rounded-lg border px-4 text-sm font-medium transition ${
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
