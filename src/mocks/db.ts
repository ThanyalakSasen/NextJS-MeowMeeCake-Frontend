// ─────────────────────────────────────────────────────────────
// src/mocks/db.ts  — in-memory store สำหรับ MSW (D17)
// ตอบตาม docs/API_CONTRACT.md §1 (envelope, query params, soft delete)
// ─────────────────────────────────────────────────────────────

export interface MockRow {
  _id: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

const stores = new Map<string, MockRow[]>();

/** ลงทะเบียน fixture ของ resource (เรียกใน handlers/index.ts) */
export function seed<T extends { _id: string }>(name: string, rows: readonly T[]): void {
  stores.set(name, rows.map((r) => ({ deleted_at: null, ...r })) as unknown as MockRow[]);
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
  return row;
}

export function update(name: string, id: string, body: Record<string, unknown>): MockRow | null {
  const rows = table(name);
  const i = rows.findIndex((r) => r._id === id && isActive(r));
  if (i === -1) return null;
  rows[i] = { ...rows[i], ...body, updated_at: new Date().toISOString() };
  return rows[i];
}

export function softDelete(name: string, id: string): boolean {
  const rows = table(name);
  const i = rows.findIndex((r) => r._id === id && isActive(r));
  if (i === -1) return false;
  rows[i] = { ...rows[i], deleted_at: new Date().toISOString() };
  return true;
}
