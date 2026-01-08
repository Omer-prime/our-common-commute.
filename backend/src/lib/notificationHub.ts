import type { Response } from "express";

const clients = new Map<string, Set<Response>>();

export function addNotificationClient(userId: string, res: Response) {
  let set = clients.get(userId);
  if (!set) {
    set = new Set<Response>();
    clients.set(userId, set);
  }
  set.add(res);
}

export function removeNotificationClient(userId: string, res: Response) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

export function pushNotification(userId: string, payload: unknown) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;

  const data = JSON.stringify(payload);
  for (const res of set) {
    res.write(`event: notification\n`);
    res.write(`data: ${data}\n\n`);
  }
}
