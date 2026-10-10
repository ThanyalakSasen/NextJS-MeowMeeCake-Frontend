"use client";
// อัปโหลดรูปแบนเนอร์ (รูปเดียว) — ผูก ImageUpload กลางเข้ากับ POST /admin/banners/images
// backend เก็บ banner_img เป็น URL จริง (เดิมเก็บ base64 แล้วพัง 400 เพราะยาวเกินเพดาน validate)
import { bannersService } from "@/services/banners";
import { SingleImageUpload } from "@/components/shared/form";

export function BannerImageUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (url: string | undefined) => void;
}) {
  return (
    <SingleImageUpload
      value={value}
      onChange={onChange}
      upload={(file) => bannersService.uploadImage(file)}
      errorKey="products.imageUploadFailed"
      name="banner-image"
    />
  );
}
