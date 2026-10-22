# Complete Architecture & Implementation Guide
## Automated Project Management, Hidden Admin Portal, & LaTeX AI Resume Studio

This document provides a complete, production-grade technical specification and porting guide for the full suite of dynamic features added to the portfolio:
1. **Automated GitHub Project Sync & Custom CMS**
2. **Secured Hidden Admin Dashboard with Neon Auth**
3. **Interactive Drag-and-Drop Project Showcase Management**
4. **Dynamic Public Resume Selection & On-Demand PDF Streaming**
5. **Overleaf-Style AI Resume Studio (LaTeX Monaco Editor + Gemini AI + Neon S3)**

This guide contains all system architectures, database schemas, component structures, API contracts, compilation pipelines, and porting steps necessary to replicate this exact setup in another portfolio website.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph GitHub
        GH_Repos["GitHub Public Repositories"]
        GH_Actions["Daily GitHub Actions Workflow (portfolio-sync.yml)"]
    end

    subgraph Neon_Cloud["Neon Cloud Services"]
        Neon_DB[("Neon Serverless PostgreSQL")]
        Neon_S3[("Neon S3 Object Storage (resume-storage)")]
    end

    subgraph Gemini_Cloud["Google AI Studio"]
        Gemini_API["Gemini 2.5 Flash / 1.5 Flash Model"]
    end

    subgraph LaTeX_Engines["Compilation Pipeline"]
        Tectonic["Local Tectonic Binary"]
        Cloud_LaTeX["Cloud PDFLaTeX Engine"]
    end

    subgraph Portfolio_App["Next.js Portfolio Application"]
        subgraph Public_Routes["Public Routes"]
            Home_Page["/ (Home Page)"]
            Projects_Page["/project & /projects"]
            Resume_Page["/resume (Dynamic PDF Stream)"]
        end

        subgraph Admin_Portal["Hidden Admin Portal (/admin)"]
            Auth_Wall["Neon Auth Wall (scrypt + session token)"]
            Project_Tab["Project Management (Drag & Drop + Accordion)"]
            Resume_Selector["Public Resume Selector"]
            AI_Studio["AI Resume Studio (Monaco Editor + PDF Preview)"]
        end

        subgraph Backend_APIs["API Endpoints (/pages/api)"]
            API_Projects["/api/projects"]
            API_Auth["/api/auth/*"]
            API_Resumes["/api/resumes/*"]
            API_Storage["/api/storage/master-context"]
            API_AI["/api/ai/*"]
            API_Compile["/api/compile"]
        end
    end

    GH_Actions -->|1. Fetch repos & sync| GH_Repos
    GH_Actions -->|2. Upsert without overwriting overrides| Neon_DB

    API_Projects <-->|Read & Update Overrides| Neon_DB
    Projects_Page <-->|Fetch project list| API_Projects

    Auth_Wall <-->|Verify Sessions| Neon_DB
    Project_Tab <-->|Reorder & edit metadata| API_Projects

    Resume_Selector <-->|Set active published resume| API_Resumes
    Resume_Page -->|Stream active compiled PDF| API_Resumes
    API_Resumes <-->|Fetch raw .tex source| Neon_S3
    API_Resumes -->|Compile .tex to PDF| LaTeX_Engines

    AI_Studio <-->|Load / Save Master Context| API_Storage
    API_Storage <-->|Read / Write master_context.md| Neon_S3
    AI_Studio <-->|Save / Save As Resumes| API_Resumes
    AI_Studio -->|Generate & refine LaTeX with JD| API_AI
    API_AI <-->|Prompt with Context + JD| Gemini_API
    AI_Studio -->|Real-time compilation preview| API_Compile
    API_Compile -->|Compile LaTeX| LaTeX_Engines
```

---

## 2. Technology Stack & Prerequisites

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (Pages Router) | Unified SSR, API routes, and client-side SPA rendering |
| **Database** | Neon Serverless PostgreSQL | Projects metadata, resume indexes, and auth sessions |
| **Object Storage** | Neon S3 / AWS S3 (`@aws-sdk/client-s3`) | Storage of raw `.tex` files and `master_context.md` |
| **Authentication** | Custom Neon Auth (Better Auth compatible) | Session tokens, secure scrypt password verification |
| **AI Engine** | Google Gemini (`@google/generative-ai`) | ATS resume tailoring and prompt-based section refinement |
| **LaTeX Compilation** | Tectonic + Cloud PDFLaTeX API | Instant browser-based preview and `/resume` streaming |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | In-browser VS Code / Overleaf editing experience |
| **Drag & Drop** | `react-beautiful-dnd` | Smooth showcase priority reordering in admin panel |
| **PDF Rendering** | `react-pdf` + PDF.js Worker | In-browser client canvas rendering of compiled PDF |

---

## 3. Database Schema Specification (Neon PostgreSQL)

All database tables are defined in [`neon/schema.sql`](file:///c:/Users/garvr/Cooking/portfolio/neon/schema.sql):

### 3.1. `portfolio_projects`
Stores GitHub repository records alongside admin overrides for priority, visibility, descriptions, and custom demo/preview URLs.

```sql
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

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_priority ON public.portfolio_projects (priority ASC);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_visible ON public.portfolio_projects (is_visible);
```

### 3.2. `resumes`
Stores cataloged resume metadata and references to objects stored in the Neon S3 bucket.

```sql
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

CREATE INDEX IF NOT EXISTS idx_resumes_published ON public.resumes (is_published DESC, updated_at DESC);
```

### 3.3. `neon_auth` Schema (Authentication Wall)
```sql
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
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neon_auth.session (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    token TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "userId" TEXT NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE
);
```

---

## 4. Object Storage Layout (Neon S3)

Bucket Name: `resume-storage` (configured via `NEON_S3_BUCKET_NAME`)

```
resume-storage/
├── master_context.md          <- Unified career biography, achievements, skills, and projects
└── resumes/
    ├── garv-resume-v1.tex     <- Raw LaTeX source for saved resume records
    ├── frontend-lead.tex
    └── google-swe-2026.tex
```

---

## 5. Feature Breakdown & Deep Dive

### Feature 1: Automated GitHub Sync with Admin Overwrite Protection

#### Problem Solved
Sync scripts typically overwrite database records with GitHub API responses, erasing custom descriptions, reordered priorities, or custom preview images set by the admin.

#### Implementation Architecture
1. **Workflow Trigger:** `.github/workflows/portfolio-sync.yml` runs daily at midnight UTC (`cron: "0 0 * * *"`) or manually via `workflow_dispatch`.
2. **Selective Upsert Engine (`scripts/syncReposNeon.js`):**
   - Fetches all public repos for the configured user from `https://api.github.com/users/{USER}/repos`.
   - Checks if the repo exists in `portfolio_projects`.
   - **If New:** Inserts with default GitHub details (`demo_url = repo.homepage || repo.html_url`, `priority = 999`, `is_visible = true`).
   - **If Existing:** **ONLY** updates `language`, `topics`, and `updated_at`. Admin fields (`display_title`, `custom_description`, `demo_url`, `custom_image_url`, `priority`, `is_visible`) are strictly left untouched.

#### GitHub Image Sanitizer Utility (`src/utils/imageUrl.js`)
Users frequently paste GitHub blob URLs (e.g. `https://github.com/user/repo/blob/main/public/image.png`). These are HTML webpages, not image assets.
The sanitizer converts these automatically:
```javascript
export function formatImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  if (trimmed.includes("github.com") && trimmed.includes("/blob/")) {
    return trimmed
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  }
  return trimmed;
}
```

---

### Feature 2: Hidden Admin Dashboard & Auth Wall

#### Architecture
- **Route:** `pages/admin.js` renders `<ProtectedRoute><AdminDashboard /></ProtectedRoute>`.
- **SSR Session Check:** `getServerSideProps` calls `verifyNeonSession(context.req)`. If no active session token exists in cookies (`neon_session_token`) or `Authorization: Bearer <token>`, it immediately delivers the unauthenticated state without leaking dashboard markup.
- **Login Endpoint:** `pages/api/auth/login.js` verifies the email in `neon_auth.user`, verifies the password hash using Node.js `crypto.scryptSync`, generates a 32-byte secure hex token in `neon_auth.session`, and sets an `HttpOnly`, `SameSite=Lax`, 30-day cookie.
- **Zero Lock-In:** Uses standard SQL queries on Neon Postgres. No third-party SaaS subscription required.

---

### Feature 3: Interactive Project Management

#### Architecture
- **Drag-and-Drop Reordering:** Built with `react-beautiful-dnd`. Dragging repository cards immediately updates visual state and triggers a batch `POST` to `/api/projects`:
  ```javascript
  await axios.post("/api/projects", [
    { repo_name: "repo-1", priority: 0 },
    { repo_name: "repo-2", priority: 1 },
  ]);
  ```
- **Live Accordion Controls:** Each repo can be expanded to modify:
  - Custom display title.
  - Live demo link override (with fallback indicator showing the GitHub homepage).
  - Custom Markdown/Text description.
  - Custom image preview URL with live rendered thumbnail.
  - Show / Hide toggle.
- **Smooth Client Navigation:** Navigation between `/` and `/project` / `/projects` is handled purely via Next.js client router without full page reloads or full-screen preloader blocking.

---

### Feature 4: Dynamic Public Resume Selection & Streaming

#### Architecture
- **Admin Resume Selector Tab (`ResumeDisplay.js`):** Displays all saved resumes from the database. The admin clicks **"Set as Public Display"**, which updates `is_published = true` in `public.resumes` (setting all others to `false`).
- **Dynamic Stream Endpoint (`pages/api/resumes/published-pdf.js`):**
  - Queries `SELECT * FROM public.resumes WHERE is_published = true LIMIT 1`.
  - Downloads `.tex` source code directly from Neon S3.
  - Compiles the LaTeX document in memory using the compilation engine.
  - Sends the compiled binary with `Content-Type: application/pdf`.
  - Sends `Cache-Control: no-cache, no-store, must-revalidate` to prevent CDN and browser caching delays.
- **Public Visitor Route (`pages/resume.js` / `ResumeNew.js`):**
  - Displays the live PDF with zoom controls and a **"Download CV"** button pointing directly to `/api/resumes/published-pdf`.
  - Appends `?v=${Date.now()}` on mount to ensure immediate reflection whenever the admin switches resumes.

---

### Feature 5: AI Resume Studio (Overleaf-Style 3-Panel IDE)

#### 1. Panel Layout (`ResumeStudio.js`)
- **Panel 1 (Left - File Tree):** Resizable sidebar showing:
  - **Files:** Master context document (`master_context.md`).
  - **Templates:** Standard LaTeX templates (e.g. Jake's Resume).
  - **Saved Resumes:** All user resumes saved in Neon S3 + PostgreSQL.
- **Panel 2 (Center - Monaco Editor):** Full VS Code Monaco Editor with LaTeX syntax highlighting, line numbers, automatic bracket matching, and word wrap.
- **Panel 3 (Right - Live PDF Preview):** Embedded PDF preview showing the compiled resume, compilation status spinner, compilation duration in seconds, error console, and quick-download button.

#### 2. Compilation Engine (`src/utils/latexCompiler.js`)
Supports a dual-engine architecture with automatic fallback:
1. **Local Engine:** If `tectonic` binary exists on the server, it runs compilation in a sandbox directory and returns the generated PDF buffer.
2. **Cloud Fallback:** If local compilation is unavailable or fails, it sends the `.tex` payload to a cloud compilation endpoint (`https://latex.ytotech.com/builds/sync`) and returns the PDF stream.

#### 3. AI Tailoring Engine (`pages/api/ai/generate.js` & `refine.js`)
- **Model:** Google Gemini API (`gemini-2.5-flash` or `gemini-1.5-flash`).
- **Inputs:**
  1. `masterContext`: Complete portfolio context, projects, technical skills, and employment history.
  2. `targetRole`: Target job title (e.g., "Senior Full-Stack Engineer").
  3. `targetCompany`: Target company (e.g., "Google").
  4. `jobDescription`: Complete job listing text.
- **Prompt Strategy:** The prompt commands Gemini to act as an expert ATS optimization engineer, selecting the strongest evidence from `masterContext`, emphasizing keywords from `jobDescription`, and returning strict, valid LaTeX matching the Jake Gutierrez resume template structure without conversational markdown framing.
- **Interactive Refinement Modal (`AiStudioModal.js`):** Allows targeted chat-based instructions (e.g. *"Quantify the bullets in the experience section with percentages"* or *"Condense skills to 1 page"*).

#### 4. Save vs. Save As Logic
- **Unsaved / New Resume (`!currentResumeId`):** Displays a simple **Save** button.
- **Existing Saved Resume (`currentResumeId`):** Displays a split button with a dropdown caret:
  - Main button triggers **Save** (overwrites the existing `.tex` file in S3 and updates PostgreSQL).
  - Dropdown caret reveals an inline text input and **"Save As New Record"** button, creating a new database record and independent S3 key without using intrusive browser `window.prompt()` alerts.

---

## 6. Complete API Route Map

| Endpoint | Method | Auth Required | Description |
| :--- | :---: | :---: | :--- |
| `/api/projects` | `GET` | No | Returns sorted list of repositories from Neon DB |
| `/api/projects` | `POST` | **Yes** | Updates single repo metadata or batch priority array |
| `/api/auth/login` | `POST` | No | Verifies admin credentials and sets session cookie |
| `/api/auth/logout` | `POST` | No | Clears session cookie and invalidates session token |
| `/api/auth/session` | `GET` | No | Checks validity of current session token |
| `/api/resumes` | `GET` | **Yes** | Lists all saved resumes from `public.resumes` |
| `/api/resumes` | `POST` | **Yes** | Saves new resume (.tex to S3, row to PostgreSQL) |
| `/api/resumes` | `PUT` | **Yes** | Updates existing resume or toggles `is_published` |
| `/api/resumes` | `DELETE`| **Yes** | Deletes resume record and associated S3 object |
| `/api/resumes/published-pdf` | `GET` | No | Compiles and streams active public resume PDF |
| `/api/resumes/preview-pdf` | `GET` | **Yes** | Compiles and streams preview of any saved resume |
| `/api/storage/master-context` | `GET` | **Yes** | Fetches `master_context.md` from Neon S3 |
| `/api/storage/master-context` | `POST` | **Yes** | Saves edited `master_context.md` to Neon S3 |
| `/api/compile` | `POST` | No | Compiles raw LaTeX payload and returns base64 PDF |
| `/api/ai/generate` | `POST` | **Yes** | Generates full tailored resume using Gemini API |
| `/api/ai/refine` | `POST` | **Yes** | Applies conversational edits to LaTeX document |

---

## 7. Step-by-Step Porting Checklist for Another Website

To replicate this exact feature suite on a new portfolio, follow this step-by-step checklist:

### Step 1: Install Required Dependencies
Run the following in the target Next.js repository:
```bash
npm install @neondatabase/serverless @aws-sdk/client-s3 @google/generative-ai @monaco-editor/react react-beautiful-dnd react-bootstrap react-icons axios
```

Ensure your `.npmrc` has:
```ini
legacy-peer-deps=true
```

### Step 2: Database & Storage Provisioning
1. Create a serverless project on [Neon](https://neon.tech).
2. Execute the SQL schema from [`neon/schema.sql`](file:///c:/Users/garvr/Cooking/portfolio/neon/schema.sql) in the Neon SQL Editor.
3. Enable Neon Object Storage or create an S3 bucket named `resume-storage`.
4. Create an admin user in `neon_auth.user`:
   ```sql
   INSERT INTO neon_auth."user" (id, name, email, "emailVerified", role)
   VALUES (gen_random_uuid()::text, 'Admin Name', 'admin@example.com', true, 'admin');
   ```

### Step 3: Configure Environment Variables
Set the following keys in `.env.local` and in your deployment provider (Vercel):
```env
DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"
NEON_DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"

AWS_ENDPOINT_URL_S3="https://<storage-endpoint>.neon.tech"
AWS_REGION="us-east-2"
AWS_ACCESS_KEY_ID="<your-access-key>"
AWS_SECRET_ACCESS_KEY="<your-secret-key>"
NEON_S3_BUCKET_NAME="resume-storage"

GEMINI_API_KEY="<google-ai-studio-api-key>"
GITHUB_TOKEN="<personal-access-token>"
```

### Step 4: Copy Files & Directories
Copy the following modules directly:
- **API Endpoints:** Copy all routes under `pages/api/` (`ai/`, `auth/`, `resumes/`, `storage/`, `compile.js`, `projects.js`).
- **Core Components:**
  - `src/components/Admin/` (`AdminDashboard.js`, `ResumeDisplay.js`)
  - `src/components/ResumeBuilder/` (`ResumeStudio.js`, `FileTree.js`, `LatexEditor.js`, `PdfPreview.js`, `AiStudioModal.js`, `templates.js`)
  - `src/components/Auth/` (`ProtectedRoute.js`)
- **Utilities:**
  - `src/utils/neonAuth.js`
  - `src/utils/imageUrl.js`
  - `src/utils/latexCompiler.js`
- **Pages:**
  - `pages/admin.js`
  - `pages/resume.js`
  - `pages/project.js` and `pages/projects.js`
- **Automation Workflow:**
  - `.github/workflows/portfolio-sync.yml`
  - `scripts/syncReposNeon.js`

### Step 5: Verification & Deployment
1. Test local build: `npm run build`.
2. Connect repository to Vercel with framework preset `Next.js`.
3. Add environment variables in Vercel project settings.
4. Log into `/admin`, verify repository drag-and-drop ordering, create and compile a LaTeX resume in AI Studio, and publish it to the live `/resume` route.
