-- ==============================================================================
-- Neon Serverless PostgreSQL Schema for Garv Rahut Portfolio & AI Resume Studio
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PORTFOLIO PROJECTS
-- ------------------------------------------------------------------------------
-- Stores GitHub repositories synchronized daily, with full support for admin
-- customization (drag-and-drop priority, custom titles, images, and URLs).
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
    repo_name VARCHAR(255) PRIMARY KEY,
    display_title VARCHAR(255) DEFAULT '',
    custom_description TEXT,
    custom_image_url TEXT,
    demo_url TEXT,
    is_visible BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 999,
    language VARCHAR(100),
    topics TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for ordering projects on the public site
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_priority ON public.portfolio_projects (priority ASC);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_visible ON public.portfolio_projects (is_visible);

-- ------------------------------------------------------------------------------
-- 2. SAVED RESUMES
-- ------------------------------------------------------------------------------
-- Stores metadata and Neon S3 object pointers for LaTeX resumes created in the
-- AI Resume Studio. The raw .tex documents are stored securely in Neon S3.
CREATE TABLE IF NOT EXISTS public.resumes (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    s3_key VARCHAR(255) NOT NULL,
    template_name VARCHAR(100) DEFAULT 'custom',
    target_role VARCHAR(255),
    target_company VARCHAR(255),
    jd_text TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for published resume lookups (/resume page and /api/resumes/published-pdf)
CREATE INDEX IF NOT EXISTS idx_resumes_published ON public.resumes (is_published DESC, updated_at DESC);

-- ------------------------------------------------------------------------------
-- 3. NEON AUTH (Better Auth Schema)
-- ------------------------------------------------------------------------------
-- Schema for admin authentication wall, session tokens, and account credentials.
CREATE SCHEMA IF NOT EXISTS neon_auth;

CREATE TABLE IF NOT EXISTS neon_auth."user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    role TEXT DEFAULT 'admin',
    banned BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neon_auth.account (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    password TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neon_auth.session (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    token TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS neon_auth.verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. NEON S3 STORAGE BUCKET ARCHITECTURE
-- ------------------------------------------------------------------------------
-- Bucket Name: resume-storage
--
-- Layout:
--   master_context.md          <- Raw master context document (career history, projects, bio)
--   resumes/<resume_id>.tex    <- Raw LaTeX source code for each saved resume
