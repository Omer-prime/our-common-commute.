-- CreateEnum
CREATE TYPE "CmsPublishStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "CmsDocType" AS ENUM ('TERMS', 'POLICY');

-- CreateEnum
CREATE TYPE "CmsGuidelineAudience" AS ENUM ('DRIVER', 'RIDER');

-- CreateTable
CREATE TABLE "CmsFaq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "CmsPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "CmsPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsDocVersion" (
    "id" TEXT NOT NULL,
    "type" "CmsDocType" NOT NULL,
    "version" TEXT NOT NULL,
    "notes" TEXT,
    "content" TEXT NOT NULL,
    "status" "CmsPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsDocVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsGuideline" (
    "id" TEXT NOT NULL,
    "audience" "CmsGuidelineAudience" NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "notes" TEXT,
    "status" "CmsPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsGuideline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CmsFaq_status_category_updatedAt_idx" ON "CmsFaq"("status", "category", "updatedAt");

-- CreateIndex
CREATE INDEX "CmsArticle_status_category_updatedAt_idx" ON "CmsArticle"("status", "category", "updatedAt");

-- CreateIndex
CREATE INDEX "CmsDocVersion_type_status_updatedAt_idx" ON "CmsDocVersion"("type", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CmsDocVersion_type_version_key" ON "CmsDocVersion"("type", "version");

-- CreateIndex
CREATE INDEX "CmsGuideline_audience_status_updatedAt_idx" ON "CmsGuideline"("audience", "status", "updatedAt");

-- AddForeignKey
ALTER TABLE "CmsFaq" ADD CONSTRAINT "CmsFaq_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsFaq" ADD CONSTRAINT "CmsFaq_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsArticle" ADD CONSTRAINT "CmsArticle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsArticle" ADD CONSTRAINT "CmsArticle_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsDocVersion" ADD CONSTRAINT "CmsDocVersion_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsGuideline" ADD CONSTRAINT "CmsGuideline_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
