import type { Response } from "express";

export type ContentScope =
  | "faqs"
  | "articles"
  | "terms"
  | "policy"
  | "driver-guidelines"
  | "rider-guidelines";

type ContentEvent = {
  scope: ContentScope;
  action: "created" | "updated" | "deleted" | "published" | "draft";
  id?: string;
  at: string;
};

const clients = new Set<Response>();

export function addContentClient(res: Response) {
  clients.add(res);
}

export function removeContentClient(res: Response) {
  clients.delete(res);
}

export function broadcastContentEvent(evt: Omit<ContentEvent, "at">) {
  const payload: ContentEvent = { ...evt, at: new Date().toISOString() };

  for (const res of clients) {
    try {
      res.write(`event: content_updated\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      clients.delete(res);
    }
  }
}
