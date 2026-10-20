"use client";
// AlertHost พร้อม theme ของ antd — โหลดแยก chunk ผ่าน LazyAlertHost (ครั้งแรกที่มี alert เท่านั้น)
import { AntdProviders } from "@/components/providers/AntdProviders";
import { AlertHost } from "./AlertHost";

export default function AntdAlertHost() {
  return (
    <AntdProviders>
      <AlertHost />
    </AntdProviders>
  );
}
