"use client";
// อัปโหลดรูปสินค้าจริง (หลายรูป) — ต่างจาก UploadImageBox (แค่เก็บ base64 ไว้ในเครื่อง) ตรงที่ยิงไฟล์
// จริงไปที่ POST /admin/products/images ทีละไฟล์ แล้วเก็บ URL ที่ได้กลับมา (backend เก็บ product_img
// เป็น array ของ URL จริง ไม่ใช่ base64 — ส่ง base64 ตรง ๆ ไปแล้ว backend ไม่รู้จัก shape นี้เลย)
import { useState } from "react";
import { Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { alert } from "@/lib/alert";
import { resolveUploadUrl } from "@/lib/uploads";

const MAX_IMAGES = 8;

export function ProductImageUpload({
  value = [],
  onChange,
}: {
  value?: string[];
  onChange?: (urls: string[]) => void;
}) {
  const t = useTranslations();
  const [uploading, setUploading] = useState(false);

  const fileList: UploadFile[] = value.map((url, i) => ({
    uid: url, // ต้องเป็น url ดิบ (ตรงกับที่เก็บใน value/DB) — onRemove ด้านล่างเทียบกับตัวนี้
    name: `image-${i}`,
    status: "done",
    url: resolveUploadUrl(url), // ใช้แค่โชว์ thumbnail — path ดิบ resolve ผิด origin ได้ 404
  }));

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const file = options.file as File;
    setUploading(true);
    try {
      const [url] = await productsService.uploadImages([file]);
      onChange?.([...value, url]);
      options.onSuccess?.({ url });
    } catch (e) {
      alert.error(t("products.imageUploadFailed"));
      options.onError?.(e as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Upload
      listType="picture-card"
      accept="image/*"
      multiple
      fileList={fileList}
      customRequest={customRequest}
      onRemove={(file) => onChange?.(value.filter((url) => url !== file.uid))}
    >
      {value.length >= MAX_IMAGES ? null : (
        <span className="flex flex-col items-center gap-1 text-xs text-gray-400">
          <PlusIcon className="h-5 w-5" />
          {uploading ? t("common.loading") : t("common.add")}
        </span>
      )}
    </Upload>
  );
}
