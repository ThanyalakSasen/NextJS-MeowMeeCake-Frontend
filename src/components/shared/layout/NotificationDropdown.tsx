"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BellIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";

export function NotificationDropdown() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount } = useNotifications(5);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        type="button"
        className="navbar-icon-btn"
        onClick={() => setOpen((p) => !p)}
        aria-label={t("title")}
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 && <span className="notif-dot" />}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">{t("title")}</span>
            {unreadCount > 0 && <span className="notif-unread-badge">{unreadCount}</span>}
          </div>

          {notifications.length > 0 ? (
            <div className="notif-list">
              {notifications.map((n) => (
                <NotificationItem key={n._id} item={n} onClick={() => setOpen(false)} />
              ))}
            </div>
          ) : (
            <p className="notif-empty">{tc("noData")}</p>
          )}

          <div className="notif-dropdown-footer">
            <Link
              href="/owner/notificationsHistory"
              className="notif-history-link"
              onClick={() => setOpen(false)}
            >
              <ClockIcon aria-hidden="true" />
              {t("viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
