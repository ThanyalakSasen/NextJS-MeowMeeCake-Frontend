// เรียก endpoint /user-logs (docs/API_CONTRACT.md §3) — อ่านอย่างเดียว
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse } from "@/types/api";
import type { UserLog, UserLogListParams } from "@/types/userLog";

const BASE = "/user-logs";

export const userLogsService = {
  list: (params: UserLogListParams = {}) => http.get<ListResponse<UserLog>>(BASE, { params }),
  get: (id: string) => http.get<ItemResponse<UserLog>>(`${BASE}/${id}`),
};
