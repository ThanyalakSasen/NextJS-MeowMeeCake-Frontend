"use client";
// View ของหน้าโปรไฟล์ — ข้อมูลบัญชี + การ์ดเชื่อม LINE (presentational ล้วน ตรรกะอยู่ใน useProfileViewModel)
import { useTranslations } from "next-intl";
import { ArrowRightOnRectangleIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { Button, Logo, Tag } from "@/components/base";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { isLinePlaceholderEmail } from "@/lib/lineAccount";
import type { useProfileViewModel } from "./useProfileViewModel";
import { LINK_STATUS_CONFIG } from "@/constants/enumConfig";

type VM = ReturnType<typeof useProfileViewModel>;

export function ProfileView(vm: VM) {
  const t = useTranslations();

  return (
    <div className="min-h-screen w-full bg-brown-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <div className="flex flex-col items-center">
          <Logo size={64} />
          <h1 className="mt-3 text-lg font-semibold text-brown-900">{t("profile.title")}</h1>
        </div>

        {vm.isLoading ? (
          <LoadingSpin />
        ) : (
          <>
            <section className="section-card">
              <div className="flex flex-col gap-0.5 px-5 py-4">
                <p className="font-medium text-brown-800">{vm.user?.fullname}</p>
                <p className="text-sm text-gray-600">
                  {isLinePlaceholderEmail(vm.user?.email) ? t("profile.lineNoEmail") : vm.user?.email}
                </p>
              </div>
            </section>

            <section className="section-card">
              <div className="section-card-header">
                <span className="section-card-title flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
                  {t("profile.line.title")}
                </span>
                {!vm.isError && (
                  <Tag color={LINK_STATUS_CONFIG[vm.linked ? "linked" : "unlinked"].antColor}>
                    {vm.linked ? t("profile.line.statusLinked") : t("profile.line.statusNotLinked")}
                  </Tag>
                )}
              </div>

              <div className="flex flex-col gap-3 px-5 py-4">
                {vm.isError ? (
                  <LoadFailed className="flex flex-col items-center gap-3 text-center" onRetry={vm.refetch} />
                ) : vm.linked ? (
                  <>
                    <p className="text-sm text-gray-600">{t("profile.line.linkedHint")}</p>
                    <Button danger block loading={vm.unlinking} onClick={vm.onUnlink}>
                      {t("profile.line.unlink")}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">{t("profile.line.addFriendHint")}</p>
                    <Button
                      type="primary"
                      block
                      disabled={!vm.canConnect}
                      loading={vm.connecting}
                      onClick={vm.onConnect}
                    >
                      {t("profile.line.connect")}
                    </Button>
                    {!vm.canConnect && <p className="text-xs text-gray-500">{t("profile.line.unavailable")}</p>}
                  </>
                )}
              </div>
            </section>

            <Button
              type="text"
              icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
              onClick={vm.onLogout}
            >
              {t("nav.logout")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
