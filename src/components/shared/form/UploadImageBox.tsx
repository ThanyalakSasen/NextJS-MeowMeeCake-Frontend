"use client";
import { useState } from "react";
import { Upload } from "antd";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
/** อัปโหลดรูปแบบ picture-card → คืน data URL (base64) ผ่าน onChange
 *  value/onChange เป็น optional เพราะ antd <Form.Item> inject ให้เอง (หรือส่งเองตอนใช้เดี่ยว) */
export function UploadImageBox({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (dataUrl: string | undefined) => void;
}) {
  const t = useTranslations();
  const [preview, setPreview] = useState<string | undefined>(value);

  return (
    <Upload
      listType="picture-card"
      showUploadList={false}
      accept="image/*"
      beforeUpload={(file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result as string;
          setPreview(url);
          onChange?.(url);
        };
        reader.readAsDataURL(file);
        return false; // ไม่อัปโหลดจริง — เก็บ base64
      }}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="w-full h-full object-cover rounded" />
      ) : (
        <span className="flex flex-col items-center text-gray-400 text-xs gap-1">
          <PlusIcon className="w-5 h-5" />
          {t("common.add")}
        </span>
      )}
    </Upload>
  );
}
