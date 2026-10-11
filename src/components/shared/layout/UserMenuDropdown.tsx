"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CUSTOMER_HOME_PATH, OWNER_ACCOUNT_PATH } from "@/constants/auth";
import { Avatar } from "@/components/base";
import type { CurrentUser } from "@/types/auth";
import DoorLogoutIcon from "@/components/customer/DoorLogoutIcon";

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
          {/* ดูหน้าร้าน = ตัวหนาสีน้ำตาล · ออกจากระบบ = สีแดง + ไอคอนประตู — หน้าตาเดียวกับเมนูผู้ใช้หน้าร้าน (customer/Navbar) */}
          <div className="notif-dropdown-footer">
            <Link
              href={CUSTOMER_HOME_PATH}
              onClick={() => setOpen(false)}
              className="notif-history-link !font-bold !text-[#8C5A3C] hover:!text-[#6B4329]"
            >
              {t("storefront")}
            </Link>
          </div>
          <div className="notif-dropdown-footer">
            <Link href={OWNER_ACCOUNT_PATH} onClick={() => setOpen(false)} className="notif-history-link">
              {t("myAccount")}
            </Link>
          </div>
          <div className="notif-dropdown-footer">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="notif-history-link group !gap-2.5 !font-semibold !text-rose-600 hover:!text-rose-700"
              style={{ width: "100%", cursor: "pointer", background: "none", border: "none" }}
            >
              <DoorLogoutIcon className="shrink-0 text-rose-500 transition-colors group-hover:text-rose-700" />
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
