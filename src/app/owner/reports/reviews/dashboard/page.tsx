import { redirect } from "next/navigation";

// แดชบอร์ดย้ายไปเป็นแท็บในหน้ารายงานความคิดเห็น — คงไว้ให้ลิงก์/บุ๊กมาร์กเดิมใช้ได้
export default function ReviewDashboardRedirect() {
  redirect("/owner/reports/reviews?tab=dashboard");
}
