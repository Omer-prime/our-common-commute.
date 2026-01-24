// backend/src/routes/adminContent.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { CmsPublishStatus, CmsGuidelineAudience, CmsDocType } from "@prisma/client";
import { addContentClient, removeContentClient, broadcastContentEvent } from "../lib/contentHub.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();


router.use(requireAuth, requireAdmin);

function getActorId(req: any): string {
  const id = req?.auth?.userId ?? req?.user?.id;
  return String(id || "");
}

function requireActorId(req: any, res: any): string | null {
  const actorId = getActorId(req);
  if (!actorId) {
  
    res.status(401).json({ ok: false, message: "Unauthorized" });
    return null;
  }
  return actorId;
}

const StatusQuery = z.enum(["all", "published", "draft"]).optional().default("all");
function statusWhere(status: string) {
  if (status === "published") return CmsPublishStatus.PUBLISHED;
  if (status === "draft") return CmsPublishStatus.DRAFT;
  return undefined;
}

/** SSE stream for realtime admin content updates (admin-only now via router.use) */
router.get("/stream", async (req, res) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  // @ts-ignore
  res.flushHeaders?.();

  res.write(`retry: 5000\n\n`);
  res.write(`event: ready\n`);
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

  addContentClient(res);

  const ping = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: {}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    removeContentClient(res);
    res.end();
  });
});

/* ----------------------------- FAQs (ADMIN) ----------------------------- */

const FaqBody = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().min(1),
  status: z.nativeEnum(CmsPublishStatus),
});

router.get("/faqs", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "all";
  const status = StatusQuery.parse(req.query.status);
  const st = statusWhere(status);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const where: any = {
    ...(st ? { status: st } : {}),
    ...(category !== "all" ? { category } : {}),
    ...(q
      ? {
          OR: [
            { question: { contains: q, mode: "insensitive" } },
            { answer: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const items = await prisma.cmsFaq.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: limit,
    select: { id: true, question: true, category: true, status: true, updatedAt: true },
  });

  return res.json({ ok: true, items });
});

router.get("/faqs/:id", async (req, res) => {
  const item = await prisma.cmsFaq.findUnique({
    where: { id: req.params.id },
    select: { id: true, question: true, answer: true, category: true, status: true, updatedAt: true, publishedAt: true },
  });
  if (!item) return res.status(404).json({ ok: false, message: "FAQ not found" });
  return res.json({ ok: true, item });
});

router.post("/faqs", async (req, res) => {
  const actorId = requireActorId(req, res);
  if (!actorId) return;

  const body = FaqBody.parse(req.body);

  const created = await prisma.cmsFaq.create({
    data: {
      question: body.question,
      answer: body.answer,
      category: body.category,
      status: body.status,
      publishedAt: body.status === CmsPublishStatus.PUBLISHED ? new Date() : null,
      createdById: actorId,
      updatedById: actorId,
    },
    select: { id: true },
  });

  broadcastContentEvent({
    scope: "faqs",
    action: body.status === CmsPublishStatus.PUBLISHED ? "published" : "created",
    id: created.id,
  });

  return res.json({ ok: true, id: created.id });
});

router.put("/faqs/:id", async (req, res) => {
  const actorId = requireActorId(req, res);
  if (!actorId) return;

  const body = FaqBody.parse(req.body);

  const existing = await prisma.cmsFaq.findUnique({
    where: { id: req.params.id },
    select: { publishedAt: true },
  });
  if (!existing) return res.status(404).json({ ok: false, message: "FAQ not found" });

  const nextPublishedAt =
    body.status === CmsPublishStatus.PUBLISHED ? existing.publishedAt ?? new Date() : null;

  await prisma.cmsFaq.update({
    where: { id: req.params.id },
    data: {
      question: body.question,
      answer: body.answer,
      category: body.category,
      status: body.status,
      publishedAt: nextPublishedAt,
      updatedById: actorId,
    },
  });

  broadcastContentEvent({
    scope: "faqs",
    action: body.status === CmsPublishStatus.PUBLISHED ? "published" : "updated",
    id: req.params.id,
  });

  return res.json({ ok: true });
});

/* -------------------------- Articles (ADMIN) -------------------------- */

const ArticleBody = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  status: z.nativeEnum(CmsPublishStatus),
});

router.get("/articles", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "all";
  const status = StatusQuery.parse(req.query.status);
  const st = statusWhere(status);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const where: any = {
    ...(st ? { status: st } : {}),
    ...(category !== "all" ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const items = await prisma.cmsArticle.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: limit,
    select: { id: true, title: true, category: true, status: true, updatedAt: true },
  });

  return res.json({ ok: true, items });
});

router.get("/articles/:id", async (req, res) => {
  const item = await prisma.cmsArticle.findUnique({
    where: { id: req.params.id },
    select: { id: true, title: true, content: true, category: true, status: true, updatedAt: true, publishedAt: true },
  });
  if (!item) return res.status(404).json({ ok: false, message: "Article not found" });
  return res.json({ ok: true, item });
});

router.post("/articles", async (req, res) => {
  const actorId = requireActorId(req, res);
  if (!actorId) return;

  const body = ArticleBody.parse(req.body);

  const created = await prisma.cmsArticle.create({
    data: {
      title: body.title,
      content: body.content,
      category: body.category,
      status: body.status,
      publishedAt: body.status === CmsPublishStatus.PUBLISHED ? new Date() : null,
      createdById: actorId,
      updatedById: actorId,
    },
    select: { id: true },
  });

  broadcastContentEvent({
    scope: "articles",
    action: body.status === CmsPublishStatus.PUBLISHED ? "published" : "created",
    id: created.id,
  });

  return res.json({ ok: true, id: created.id });
});

router.put("/articles/:id", async (req, res) => {
  const actorId = requireActorId(req, res);
  if (!actorId) return;

  const body = ArticleBody.parse(req.body);

  const existing = await prisma.cmsArticle.findUnique({
    where: { id: req.params.id },
    select: { publishedAt: true },
  });
  if (!existing) return res.status(404).json({ ok: false, message: "Article not found" });

  const nextPublishedAt =
    body.status === CmsPublishStatus.PUBLISHED ? existing.publishedAt ?? new Date() : null;

  await prisma.cmsArticle.update({
    where: { id: req.params.id },
    data: {
      title: body.title,
      content: body.content,
      category: body.category,
      status: body.status,
      publishedAt: nextPublishedAt,
      updatedById: actorId,
    },
  });

  broadcastContentEvent({
    scope: "articles",
    action: body.status === CmsPublishStatus.PUBLISHED ? "published" : "updated",
    id: req.params.id,
  });

  return res.json({ ok: true });
});

/* ------------------------- Docs (ADMIN) ------------------------- */

const DocBody = z.object({
  type: z.enum(["TERMS", "POLICY"]),
  version: z.string().min(1),
  notes: z.string().optional().default(""),
  content: z.string().min(1),
  status: z.nativeEnum(CmsPublishStatus),
});

router.get("/docs", async (req, res) => {
  const type = z.enum(["TERMS", "POLICY"]).parse(req.query.type);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const status = StatusQuery.parse(req.query.status);
  const st = statusWhere(status);

  const where: any = {
    type: type === "TERMS" ? CmsDocType.TERMS : CmsDocType.POLICY,
    ...(st ? { status: st } : {}),
    ...(q
      ? {
          OR: [
            { version: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const items = await prisma.cmsDocVersion.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      version: true,
      notes: true,
      content: true,
      status: true,
      updatedAt: true,
      updatedBy: { select: { fullName: true } },
    },
  });

  return res.json({ ok: true, items });
});

router.post("/docs", async (req, res) => {
  const actorId = requireActorId(req, res);
  if (!actorId) return;

  const body = DocBody.parse(req.body);

  const created = await prisma.cmsDocVersion.create({
    data: {
      type: body.type === "TERMS" ? CmsDocType.TERMS : CmsDocType.POLICY,
      version: body.version,
      notes: body.notes || null,
      content: body.content,
      status: body.status,
      publishedAt: body.status === CmsPublishStatus.PUBLISHED ? new Date() : null,
      updatedById: actorId,
    },
    select: { id: true },
  });

  broadcastContentEvent({
    scope: body.type === "TERMS" ? "terms" : "policy",
    action: body.status === CmsPublishStatus.PUBLISHED ? "published" : "created",
    id: created.id,
  });

  return res.json({ ok: true, id: created.id });
});

router.put("/docs/:id", async (req, res) => {
  const actorId = requireActorId(req, res);
  if (!actorId) return;

  const body = DocBody.parse(req.body);

  const existing = await prisma.cmsDocVersion.findUnique({
    where: { id: req.params.id },
    select: { publishedAt: true },
  });
  if (!existing) return res.status(404).json({ ok: false, message: "Doc version not found" });

  await prisma.cmsDocVersion.update({
    where: { id: req.params.id },
    data: {
      type: body.type === "TERMS" ? CmsDocType.TERMS : CmsDocType.POLICY,
      version: body.version,
      notes: body.notes || null,
      content: body.content,
      status: body.status,
      publishedAt: body.status === CmsPublishStatus.PUBLISHED ? existing.publishedAt ?? new Date() : null,
      updatedById: actorId,
    },
  });

  broadcastContentEvent({
    scope: body.type === "TERMS" ? "terms" : "policy",
    action: body.status === CmsPublishStatus.PUBLISHED ? "published" : "updated",
    id: req.params.id,
  });

  return res.json({ ok: true });
});

/* --------------------------- Guidelines (ADMIN) --------------------------- */

const GuidelineBody = z.object({
  audience: z.enum(["DRIVER", "RIDER"]),
  sectionTitle: z.string().min(1),
  content: z.string().min(1),
  notes: z.string().optional().default(""),
  status: z.nativeEnum(CmsPublishStatus),
});

router.get("/guidelines", async (req, res) => {
  const audience = z.enum(["DRIVER", "RIDER"]).parse(req.query.audience);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const status = StatusQuery.parse(req.query.status);
  const st = statusWhere(status);

  const where: any = {
    audience: audience === "DRIVER" ? CmsGuidelineAudience.DRIVER : CmsGuidelineAudience.RIDER,
    ...(st ? { status: st } : {}),
    ...(q
      ? {
          OR: [
            { sectionTitle: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const items = await prisma.cmsGuideline.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: { id: true, sectionTitle: true, notes: true, status: true, updatedAt: true },
  });

  return res.json({ ok: true, items });
});

router.get("/guidelines/:id", async (req, res) => {
  const item = await prisma.cmsGuideline.findUnique({
    where: { id: req.params.id },
    select: { id: true, audience: true, sectionTitle: true, content: true, notes: true, status: true, updatedAt: true, publishedAt: true },
  });
  if (!item) return res.status(404).json({ ok: false, message: "Guideline not found" });
  return res.json({ ok: true, item });
});

router.post("/guidelines", async (req, res) => {
  const actorId = requireActorId(req, res);
  if (!actorId) return;

  const body = GuidelineBody.parse(req.body);

  const created = await prisma.cmsGuideline.create({
    data: {
      audience: body.audience === "DRIVER" ? CmsGuidelineAudience.DRIVER : CmsGuidelineAudience.RIDER,
      sectionTitle: body.sectionTitle,
      content: body.content,
      notes: body.notes || null,
      status: body.status,
      publishedAt: body.status === CmsPublishStatus.PUBLISHED ? new Date() : null,
      updatedById: actorId,
    },
    select: { id: true },
  });

  broadcastContentEvent({
    scope: body.audience === "DRIVER" ? "driver-guidelines" : "rider-guidelines",
    action: body.status === CmsPublishStatus.PUBLISHED ? "published" : "created",
    id: created.id,
  });

  return res.json({ ok: true, id: created.id });
});

router.put("/guidelines/:id", async (req, res) => {
  const actorId = requireActorId(req, res);
  if (!actorId) return;

  const body = GuidelineBody.parse(req.body);

  const existing = await prisma.cmsGuideline.findUnique({
    where: { id: req.params.id },
    select: { publishedAt: true },
  });
  if (!existing) return res.status(404).json({ ok: false, message: "Guideline not found" });

  const nextPublishedAt =
    body.status === CmsPublishStatus.PUBLISHED ? existing.publishedAt ?? new Date() : null;

  await prisma.cmsGuideline.update({
    where: { id: req.params.id },
    data: {
      audience: body.audience === "DRIVER" ? CmsGuidelineAudience.DRIVER : CmsGuidelineAudience.RIDER,
      sectionTitle: body.sectionTitle,
      content: body.content,
      notes: body.notes || null,
      status: body.status,
      publishedAt: nextPublishedAt,
      updatedById: actorId,
    },
  });

  broadcastContentEvent({
    scope: body.audience === "DRIVER" ? "driver-guidelines" : "rider-guidelines",
    action: body.status === CmsPublishStatus.PUBLISHED ? "published" : "updated",
    id: req.params.id,
  });

  return res.json({ ok: true });
});

export default router;
