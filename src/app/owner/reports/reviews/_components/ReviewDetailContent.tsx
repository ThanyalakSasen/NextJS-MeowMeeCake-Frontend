"use client";
// เนื้อหาใน DetailDrawer ของหน้า Reviews — sentiment fetch แยกตอนเปิดดู (ไม่มาใน list ของ review เอง)
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Avatar, Divider, Tag } from "@/components/base";
import { LoadingSpin } from "@/components/shared/feedback";
import { formatDate } from "@/i18n/format";
import { reviewsService } from "@/services/reviews";
import { SENTIMENT_LABEL_CONFIG } from "@/constants/enumConfig";
import type { ReviewRow } from "../useReviewsViewModel";
import { StarRating } from "./StarRating";

export function ReviewDetailContent({ review }: { review: ReviewRow }) {
  const t = useTranslations();
  const locale = useLocale();

  const sentimentQ = useQuery({
    queryKey: ["review-sentiment", review._id],
    queryFn: () => reviewsService.sentiment(review._id),
    enabled: review.is_analyzed,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar name={review.userName} size={44} />
        <div>
          <p className="font-semibold text-brown-800">{review.userName}</p>
          <p className="text-sm text-gray-500">{formatDate(review.created_at, locale, { withTime: true })}</p>
        </div>
      </div>

      <Divider className="!my-0" />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{t("reviews.colProduct")}</span>
        <span className="font-medium text-gray-800">{review.productName}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{t("reviews.colRating")}</span>
        <StarRating rating={review.rating} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{t("reviews.colStatus")}</span>
        <Tag color={review.is_visible ? "success" : "default"}>
          {t(review.is_visible ? "reviews.statusVisible" : "reviews.statusHidden")}
        </Tag>
      </div>

      <Divider className="!my-0" />

      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-600">{t("reviews.colText")}</p>
        <p className="text-sm text-gray-700">{review.review_text || t("reviews.noComment")}</p>
      </div>

      {review.image && review.image.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.image.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg border border-gray-200 object-cover" />
          ))}
        </div>
      )}

      <Divider className="!my-0" />

      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">{t("reviews.sentimentTitle")}</p>
        {!review.is_analyzed ? (
          <p className="text-sm text-gray-400">{t("reviews.sentimentNotAnalyzed")}</p>
        ) : sentimentQ.isLoading ? (
          <LoadingSpin />
        ) : !sentimentQ.data || sentimentQ.data.length === 0 ? (
          <p className="text-sm text-gray-400">{t("reviews.sentimentEmpty")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sentimentQ.data.map((s) => {
              const aspect = typeof s.aspect_id === "object" ? s.aspect_id : undefined;
              const cfg = SENTIMENT_LABEL_CONFIG[s.sentiment_label];
              return (
                <div key={s._id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{aspect?.aspect_name_th ?? "—"}</span>
                    <Tag color={cfg.antColor}>{t(`enums.sentimentLabel.${s.sentiment_label}`)}</Tag>
                  </div>
                  {s.sentiment_result && <p className="mt-1 text-xs text-gray-500">{s.sentiment_result}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
