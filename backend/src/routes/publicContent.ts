import { Router } from "express";
import { prisma } from "../prisma.js";
import { CmsPublishStatus, CmsGuidelineAudience, CmsDocType } from "@prisma/client";
import { addContentClient, removeContentClient } from "../lib/contentHub.js";

const router = Router();

/** SSE stream for realtime public content updates */
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

/* ----------------------------- FAQs ----------------------------- */
router.get("/faqs", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "all";

  const where: any = {
    status: CmsPublishStatus.PUBLISHED,
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
    select: { id: true, question: true, answer: true, category: true, updatedAt: true },
  });

  return res.json({ ok: true, items });
});

/* -------------------------- Help Articles -------------------------- */
router.get("/articles", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "all";

  const where: any = {
    status: CmsPublishStatus.PUBLISHED,
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
    select: { id: true, title: true, content: true, category: true, updatedAt: true },
  });

  return res.json({ ok: true, items });
});

/* ------------------------- Terms & Policy ------------------------- */
router.get("/docs/terms", async (_req, res) => {
  const doc = await prisma.cmsDocVersion.findFirst({
    where: { type: CmsDocType.TERMS, status: CmsPublishStatus.PUBLISHED },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: { id: true, version: true, content: true, updatedAt: true },
  });

  return res.json({ ok: true, doc });
});

router.get("/docs/policy", async (_req, res) => {
  const doc = await prisma.cmsDocVersion.findFirst({
    where: { type: CmsDocType.POLICY, status: CmsPublishStatus.PUBLISHED },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: { id: true, version: true, content: true, updatedAt: true },
  });

  return res.json({ ok: true, doc });
});

/* --------------------------- Guidelines --------------------------- */
router.get("/guidelines/driver", async (_req, res) => {
  const items = await prisma.cmsGuideline.findMany({
    where: { audience: CmsGuidelineAudience.DRIVER, status: CmsPublishStatus.PUBLISHED },
    orderBy: { updatedAt: "desc" },
    select: { id: true, sectionTitle: true, content: true, notes: true, updatedAt: true },
  });

  return res.json({ ok: true, items });
});

router.get("/guidelines/rider", async (_req, res) => {
  const items = await prisma.cmsGuideline.findMany({
    where: { audience: CmsGuidelineAudience.RIDER, status: CmsPublishStatus.PUBLISHED },
    orderBy: { updatedAt: "desc" },
    select: { id: true, sectionTitle: true, content: true, notes: true, updatedAt: true },
  });

  return res.json({ ok: true, items });
});

export default router;
