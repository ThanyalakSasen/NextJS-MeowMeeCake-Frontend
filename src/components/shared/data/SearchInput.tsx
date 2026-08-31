"use client";
import { Input } from "antd";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
/** ช่องค้นหามีไอคอนแว่นขยาย — controlled */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("common");
  return (
    <Input
      allowClear
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? t("search")}
      prefix={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
      className={className}
      style={{ maxWidth: 280 }}
    />
  );
}
