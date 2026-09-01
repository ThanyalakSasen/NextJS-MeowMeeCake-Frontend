// ─────────────────────────────────────────────────────────────
// src/mocks/db.ts  — in-memory store สำหรับ MSW (D17)
// ตอบตาม docs/API_CONTRACT.md §1 (envelope, query params, soft delete)
//
// persist ลง localStorage (`mmc_mock_db`) → ข้อมูลที่กดในแอป (POST/PATCH/DELETE)
// "อยู่ข้ามรีเฟรชหน้า" — เดินงานหน้าร้าน/ออเดอร์ต่อเนื่องได้จริง
//   • กลับไป fixture เริ่มต้น: เปิด console แล้วรัน `__resetMockDb()` → รีเฟรช
//   • แก้ fixture แล้วอยากให้มีผล: bump `SEED_VERSION` ด้านล่าง (เวอร์ชันไม่ตรง = ล้าง store อัตโนมัติ)
// ─────────────────────────────────────────────────────────────

export interface MockRow {
  _id: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

const stores = new Map<string, MockRow[]>();

// ── persistence ──
const LS_KEY = "mmc_mock_db";
const LS_VERSION_KEY = "mmc_mock_db_version";
/** bump เมื่อ fixture เปลี่ยนโครง/ค่า แล้วอยากให้ store ที่ persist ไว้ถูกล้างทิ้ง */
const SEED_VERSION = "2026-09-01-p9";

const canPersist = (): boolean => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

function hydrate(): void {
  if (!canPersist()) return;
  try {
    if (localStorage.getItem(LS_VERSION_KEY) !== SEED_VERSION) {
      localStorage.removeItem(LS_KEY);
      localStorage.setItem(LS_VERSION_KEY, SEED_VERSION);
      return; // เริ่มใหม่ — seed() จะเติมให้
    }
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, MockRow[]>;
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v)) stores.set(k, v);
    }
  } catch {
    // JSON เสีย / อ่านไม่ได้ — ปล่อยให้ seed() เริ่มใหม่
  }
}

function persist(): void {
  if (!canPersist()) return;
  try {
    const obj: Record<string, MockRow[]> = {};
    for (const [k, v] of stores) obj[k] = v;
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {
    // quota เต็ม / private mode — ข้ามไป (ยังใช้ได้ในหน่วยความจำ)
  }
}

/** ล้าง store ทั้งหมด (ทั้งในหน่วยความจำและ localStorage) — ต้องรีเฟรชหน้าเพื่อ seed ใหม่ */
export function resetMockDb(): void {
  stores.clear();
  if (canPersist()) {
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_VERSION_KEY);
    } catch {
      // ignore
    }
  }
}

hydrate();
if (canPersist()) {
  (window as unknown as { __resetMockDb?: () => void }).__resetMockDb = resetMockDb;
}

/** ลงทะเบียน fixture ของ resource (เรียกใน handlers/index.ts)
 *  idempotent: ถ้ามีข้อมูล resource นี้อยู่แล้ว (จาก localStorage) จะไม่ทับ */
export function seed<T extends { _id: string }>(name: string, rows: readonly T[]): void {
  const existing = stores.get(name);
  if (existing && existing.length > 0) return;
  stores.set(name, rows.map((r) => ({ deleted_at: null, ...r })) as unknown as MockRow[]);
  persist();
}

function table(name: string): MockRow[] {
  if (!stores.has(name)) stores.set(name, []);
  return stores.get(name)!;
}

const isActive = (r: MockRow) => r.deleted_at === null || r.deleted_at === undefined;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `mock_${Math.random().toString(36).slice(2)}`;
}

// ── operations ที่ crudHandlers เรียก ──

export function list(name: string, url: URL): { data: MockRow[]; meta: { page: number; limit: number; total: number } } {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit")) || 50));
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  const sort = url.searchParams.get("sort") ?? "-created_at";

  let rows = table(name).filter(isActive);

  // filter ตรงตัว: query param ที่ตรงกับชื่อ field (ข้าม param สงวน)
  const RESERVED = new Set(["page", "limit", "search", "sort", "include"]);
  for (const [key, value] of url.searchParams.entries()) {
    if (RESERVED.has(key)) continue;
    rows = rows.filter((r) => String(r[key] ?? "") === value);
  }

  // search: substring ในทุก field ที่เป็น string
  if (search) {
    rows = rows.filter((r) =>
      Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes(search)),
    );
  }

  // sort
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  rows = [...rows].sort((a, b) => {
    const av = String(a[field] ?? "");
    const bv = String(b[field] ?? "");
    return desc ? bv.localeCompare(av) : av.localeCompare(bv);
  });

  const total = rows.length;
  return { data: rows.slice((page - 1) * limit, page * limit), meta: { page, limit, total } };
}

export function getById(name: string, id: string): MockRow | null {
  return table(name).find((r) => r._id === id && isActive(r)) ?? null;
}

export function create(name: string, body: Record<string, unknown>): MockRow {
  const now = new Date().toISOString();
  const row: MockRow = { _id: newId(), deleted_at: null, created_at: now, updated_at: now, ...body };
  table(name).unshift(row);
  persist();
  return row;
}

export function update(name: string, id: string, body: Record<string, unknown>): MockRow | null {
  const rows = table(name);
  const i = rows.findIndex((r) => r._id === id && isActive(r));
  if (i === -1) return null;
  rows[i] = { ...rows[i], ...body, updated_at: new Date().toISOString() };
  persist();
  return rows[i];
}

export function softDelete(name: string, id: string): boolean {
  const rows = table(name);
  const i = rows.findIndex((r) => r._id === id && isActive(r));
  if (i === -1) return false;
  rows[i] = { ...rows[i], deleted_at: new Date().toISOString() };
  persist();
  return true;
}
