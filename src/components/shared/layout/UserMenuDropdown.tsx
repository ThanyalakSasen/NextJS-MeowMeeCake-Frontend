"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/base";
import type { CurrentUser } from "@/types/auth";

export function UserMenuDropdown({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="navbar-actor-btn"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        title={user.fullname}
      >
        <Avatar name={user.fullname} size={32} />
        <span className="owner-name">{user.fullname}</span>
      </button>

      {open && (
        <div className="notif-dropdown" style={{ right: 0 }}>
          <div className="notif-item" style={{ width: "100%" }}>
            <Avatar name={user.fullname} size={28} />
            <div className="notif-item-body">
              <p className="notif-item-message">{user.fullname}</p>
              <p className="notif-item-time">{user.roleName}</p>
            </div>
          </div>
          <div className="notif-dropdown-footer">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="notif-history-link"
              style={{ width: "100%", cursor: "pointer", background: "none", border: "none" }}
            >
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
