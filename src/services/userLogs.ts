// เรียก endpoint /admin/user-logs — อ่านอย่างเดียว
// user_id ถูก backend populate เป็น object เต็ม {_id, user_fullname, email} — แกะกลับเป็น
// string id ตรงนี้ที่เดียว (refId) ให้ ViewModel เทียบ/join กับ users list ได้ตรง ๆ
import { http, type HttpReader } from "@/lib/http";
import { refId } from "@/lib/refId";
import type { ItemResponse } from "@/types/api";
import type { RawUserLog, UserLog, UserLogListParams } from "@/types/userLog";

const BASE = "/admin/user-logs";

function toUserLog(raw: RawUserLog): UserLog {
  return { ...raw, user_id: refId(raw.user_id) };
}

export const userLogsService = {
  /** h = http client (ค่าเริ่มต้น http ปกติ) — ฝั่ง server ส่ง withConfig(cookie + no-store) เข้ามา (userLog/page.tsx) */
  list: async (params: UserLogListParams = {}, h: HttpReader = http) => {
    const res = await h.getList<RawUserLog>(BASE, { params });
    return { ...res, data: res.data.map(toUserLog) };
  },

  /** ประวัติการทำงานของผู้ที่ล็อกอิน (หน้า "บัญชีของฉัน" หลังร้าน) — /shop/me/activity ไม่ต้องมีสิทธิ์ employees · backend บังคับ user_id = ตัวเอง */
  listMine: async (params: Omit<UserLogListParams, "user_id"> = {}) => {
    const res = await http.getList<RawUserLog>("/shop/me/activity", { params });
    return { ...res, data: res.data.map(toUserLog) };
  },

  get: async (id: string) => {
    const res = await http.get<ItemResponse<RawUserLog>>(`${BASE}/${id}`);
    return { data: toUserLog(res.data) };
  },
};
