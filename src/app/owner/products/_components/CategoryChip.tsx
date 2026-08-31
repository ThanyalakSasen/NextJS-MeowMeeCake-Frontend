"use client";
import { DotIndicator } from "@/components/base";
function hashColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const palette = ["#f43f5e", "#8b5cf6", "#f59e0b", "#22c55e", "#0ea5e9", "#ec4899"];
  return palette[h % palette.length];
}
export function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
        active ? "border-brown-400 bg-brown-50 text-brown-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      <DotIndicator color={hashColor(label)} size={7} />
      {label}
    </button>
  );
}
