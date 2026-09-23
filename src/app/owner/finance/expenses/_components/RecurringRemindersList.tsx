"use client";
// รายจ่ายประจำที่ใกล้ครบกำหนด — presentational ล้วน (คำนวณวันครบกำหนดที่ ViewModel)
import { useTranslations } from "next-intl";
import { ExclamationTriangleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Card } from "@/components/base";
import { formatCurrency, formatDate } from "@/i18n/format";

export interface RecurringReminder {
  _id: string;
  description: string;
  dueDate: string;
  amount: number;
  isUrgent: boolean;
}

/** className — เช่น "min-h-0 flex-1" ให้การ์ดยืดเต็มที่ว่างที่เหลือของคอลัมน์ รายการที่ยาวเกินเลื่อนดูในการ์ด */
export function RecurringRemindersList({
  reminders,
  locale,
  className = "",
}: {
  reminders: RecurringReminder[];
  locale: string;
  className?: string;
}) {
  const t = useTranslations();

  return (
    <Card className={`flex flex-col overflow-hidden ${className}`}>
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-brown-900">{t("finance.recurringTitle")}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
        {reminders.length === 0 ? (
          <p className="py-2 text-center text-sm text-gray-400">{t("finance.recurringEmpty")}</p>
        ) : (
          reminders.map((r) => (
            <div
              key={r._id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${r.isUrgent ? "border border-red-100 bg-red-50" : "bg-gray-50"}`}
            >
              <div className="flex items-center gap-2">
                {r.isUrgent ? (
                  <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 text-red-400" />
                ) : (
                  <ClockIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-brown-900">{r.description}</p>
                  <p className="text-sm text-gray-400">{t("finance.dueOn", { date: formatDate(r.dueDate, locale) })}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${r.isUrgent ? "text-red-500" : "text-amber-600"}`}>
                {formatCurrency(r.amount, locale)}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
