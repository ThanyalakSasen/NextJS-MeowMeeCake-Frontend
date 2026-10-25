"use client";
import { Tooltip } from "antd";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

/** ไอคอน ⓘ — ชี้/แตะ/โฟกัสแล้วขึ้นคำอธิบาย (ใช้ข้างป้าย/หัวข้อ ให้รู้ว่าตัวเลขหรือส่วนนั้นคืออะไร) */
export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip title={text} trigger={["hover", "click", "focus"]}>
      <button type="button" aria-label={text} className="inline-flex shrink-0 cursor-help border-none bg-transparent p-0 text-gray-500 hover:text-brown-700">
        <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
