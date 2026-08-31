"use client";
import Link from "next/link";
import { DotIndicator } from "@/components/base";
import { NOTIFICATION_TYPE_COLOR } from "@/constants/enumConfig";
import type { NotificationDTO } from "@/types/notification";

export function NotificationItem({ item, onClick }: { item: NotificationDTO; onClick?: () => void }) {
  const body = (
    <>
      <DotIndicator color={NOTIFICATION_TYPE_COLOR[item.type]} className="mt-1" />
      <div className="notif-item-body">
        <p className="notif-item-message">{item.title}</p>
        <p className="notif-item-time">{item.message}</p>
      </div>
    </>
  );
  const cls = `notif-item${item.is_read ? "" : " unread"}`;
  return item.link ? (
    <Link href={item.link} className={cls} onClick={onClick}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
