"use client";
// อัปโหลดรูปแบนเนอร์จริง (รูปเดียว) — ต่างจาก UploadImageBox (แค่เก็บ base64 ไว้ในเครื่อง) ตรงที่ยิงไฟล์
// จริงไปที่ POST /admin/banners/images แล้วเก็บ URL ที่ได้กลับมา (backend เก็บ banner_img เป็น URL จริง
// ตั้งแต่แก้ docs/BACKLOG.md §5/§8 — เดิมเก็บ base64 ตรง ๆ ทำให้อัปโหลดรูปจริงพัง 400 เพราะยาวเกิน
// เพดานความยาวที่ backend validate ไว้ — แพทเทิร์นเดียวกับ ProductImageUpload.tsx แต่มีรูปเดียว ไม่ใช่ array)
import { useState } from "react";
import { Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { bannersService } from "@/services/banners";
import { resolveUploadUrl } from "@/lib/uploads";
import { alert } from "@/lib/alert";

export function BannerImageUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (url: string | undefined) => void;
}) {
  const t = useTranslations();
  const [uploading, setUploading] = useState(false);

  const fileList: UploadFile[] = value
    ? [{ uid: value, name: "banner-image", status: "done", url: resolveUploadUrl(value) }]
    : [];

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const file = options.file as File;
    setUploading(true);
    try {
      const url = await bannersService.uploadImage(file);
      onChange?.(url);
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
      maxCount={1}
      fileList={fileList}
      customRequest={customRequest}
      onRemove={() => onChange?.(undefined)}
    >
      {value ? null : (
        <span className="flex flex-col items-center gap-1 text-xs text-gray-400">
          <PlusIcon className="h-5 w-5" />
          {uploading ? t("common.loading") : t("common.add")}
        </span>
      )}
    </Upload>
  );
}
