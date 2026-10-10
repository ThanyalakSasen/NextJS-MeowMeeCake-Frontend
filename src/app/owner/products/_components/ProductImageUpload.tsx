"use client";
// อัปโหลดรูปสินค้า (หลายรูป) — ผูก ImageUpload กลางเข้ากับ POST /admin/products/images
// backend เก็บ product_img เป็น array ของ URL จริง ไม่ใช่ base64
import { productsService } from "@/services/products";
import { ImageUpload } from "@/components/shared/form";

const MAX_IMAGES = 8;

export function ProductImageUpload({
  value = [],
  onChange,
}: {
  value?: string[];
  onChange?: (urls: string[]) => void;
}) {
  return (
    <ImageUpload
      urls={value}
      onUrlsChange={(urls) => onChange?.(urls)}
      upload={async (file) => (await productsService.uploadImages([file]))[0]}
      errorKey="products.imageUploadFailed"
      max={MAX_IMAGES}
      name="image"
    />
  );
}
