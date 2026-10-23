"use client";
import Link from "next/link";
import type { NotificationDTO } from "@/types/notification";

export function NotificationItem({ item, onClick }: { item: NotificationDTO; onClick?: () => void }) {
  const body = (
    <>
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
