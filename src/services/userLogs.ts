// เรียก endpoint /admin/user-logs — อ่านอย่างเดียว
// user_id ถูก backend populate เป็น object เต็ม {_id, user_fullname, email} — แกะกลับเป็น
// string id ตรงนี้ที่เดียว (refId) ให้ ViewModel เทียบ/join กับ users list ได้ตรง ๆ
import { http } from "@/lib/http";
import { refId } from "@/lib/refId";
import type { ItemResponse } from "@/types/api";
import type { RawUserLog, UserLog, UserLogListParams } from "@/types/userLog";

const BASE = "/admin/user-logs";

function toUserLog(raw: RawUserLog): UserLog {
  return { ...raw, user_id: refId(raw.user_id) };
}

export const userLogsService = {
  list: async (params: UserLogListParams = {}) => {
    const res = await http.getList<RawUserLog>(BASE, { params });
    return { ...res, data: res.data.map(toUserLog) };
  },

  get: async (id: string) => {
    const res = await http.get<ItemResponse<RawUserLog>>(`${BASE}/${id}`);
    return { data: toUserLog(res.data) };
  },
};
