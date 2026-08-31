// ─────────────────────────────────────────────────────────────
// src/mocks/handlers/_crud.ts
// factory สร้าง handler CRUD มาตรฐานตาม docs/API_CONTRACT.md §3
// resource ใหม่: crudHandlers("orders", `${API}/orders`) — เท่านี้
// ─────────────────────────────────────────────────────────────
import { http, HttpResponse } from "msw";
import { list, getById, create, update, softDelete } from "@/mocks/db";

const notFound = () => HttpResponse.json({ message: "not found" }, { status: 404 });

export function crudHandlers(name: string, basePath: string) {
  return [
    http.get(basePath, ({ request }) => HttpResponse.json(list(name, new URL(request.url)))),

    http.get(`${basePath}/:id`, ({ params }) => {
      const row = getById(name, String(params.id));
      return row ? HttpResponse.json({ data: row }) : notFound();
    }),

    http.post(basePath, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ data: create(name, body) }, { status: 201 });
    }),

    http.patch(`${basePath}/:id`, async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const row = update(name, String(params.id), body);
      return row ? HttpResponse.json({ data: row }) : notFound();
    }),

    http.delete(`${basePath}/:id`, ({ params }) => {
      return softDelete(name, String(params.id)) ? HttpResponse.json({ data: null }) : notFound();
    }),
  ];
}
