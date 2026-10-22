<h1 align="center">
  <br>
  Garv Rahut — Personal Portfolio & AI Resume Studio
  <br>
</h1>

<p align="center">
  Modern, full-stack developer portfolio, dynamic project CMS, and LaTeX-powered AI Resume Studio.
</p>

<p align="center">
  <a href="https://garv767.is-a.dev" target="_blank">
    <strong>🌐 Primary Domain: garv767.is-a.dev</strong>
  </a>
  &nbsp;|&nbsp;
  <a href="https://garv.is-a.dev" target="_blank">
    <strong>Mirror: garv.is-a.dev</strong>
  </a>
</p>

<div align="center">

[![Live Site](https://img.shields.io/badge/Live_Site-garv767.is--a.dev-623686?style=for-the-badge&logo=google-chrome&logoColor=white)](https://garv767.is-a.dev)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Neon Database](https://img.shields.io/badge/Neon-PostgreSQL_%26_S3-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)

</div>

---

## ✨ Key Features (Hidden Admin Panel)

> 🔒 **Hidden Admin Panel (Secured with Auth Wall):** These features are located inside a hidden admin panel accessible at `/admin`, which is secured with an authentication wall backed by **Neon Auth (PostgreSQL sessions)**. It enables seamless drag-and-drop project curation, dynamic resume publishing, and AI-powered LaTeX generation while ensuring public visitor pages remain clean, fast, and protected.

### 1. 🗂️ Interactive Project Management
- **Drag-and-Drop Priority Reordering:** Seamlessly drag repositories inside the admin dashboard to reorder their showcase priority on the live portfolio.
- **Accordion Control:** Fine-tune custom titles, override live demo links (or fallback automatically to GitHub repo homepages), and attach custom preview image URLs.
- **Neon PostgreSQL Sync:** Syncs GitHub repos directly to Neon PostgreSQL, preserving visibility and custom metadata via daily GitHub Actions workflow.

<details>
<summary><b>📸 View Feature Screenshot: Project Management</b></summary>

<br>

<div align="center">
  <img src="public/project-management-feature.png" alt="Project Management" width="850" />
</div>

</details>

---

### 2. 📄 Dynamic Public Resume Display
- **Admin Resume Selector:** Rather than hardcoding static PDFs in `public/`, the admin selects which saved resume from Neon database to publish.
- **Live PDF Compilation & Serving:** Automatically serves and streams the compiled PDF on `/resume` via dynamic API (`/api/resumes/published-pdf`).

<details>
<summary><b>📸 View Feature Screenshot: Public Resume Display Selector</b></summary>

<br>

<div align="center">
  <img src="public/resume-display-feature.png" alt="Resume Display Selector" width="850" />
</div>

</details>

---

### 3. ⚡ AI Resume Studio
- **Overleaf-Style 3-Panel IDE:** Resizable split panels for **Files / Master Context**, **LaTeX Monaco Editor**, and **Live PDF Preview**.
- **Save & Save As:** Overwrite existing resume records or create distinct versions with a dropdown.
- **Neon S3 + PostgreSQL:** Stores raw `.tex` source documents securely in Neon S3 storage with metadata indexed in PostgreSQL.
- **AI Tailoring:** Uses Google Gemini to analyze Master Context and target Job Descriptions, crafting ATS-optimized LaTeX resumes.

<details>
<summary><b>📸 View Feature Screenshot: AI Resume Studio & LaTeX Editor</b></summary>

<br>

<div align="center">
  <img src="public/resume-studio-feature.png" alt="AI Resume Studio" width="850" />
</div>

</details>

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Database:** [Neon Serverless PostgreSQL](https://neon.tech/)
- **Object Storage:** [Neon S3 Bucket](https://neon.tech/) (AWS S3 SDK)
- **LaTeX Compilation:** Local Tectonic & Cloud PDFLaTeX engines
- **AI Engine:** Google Gemini API (`@google/generative-ai`)
- **Styling:** CSS3, React-Bootstrap, Monaco Editor, React Beautiful DnD

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/garv767/portfolio.git
cd portfolio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file (or copy from `.env.example`) with the following keys:
```env
# Neon PostgreSQL Database
DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require
NEON_DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require

# Neon S3-Compatible Storage
AWS_ENDPOINT_URL_S3=https://br-xyz.storage.c-6.us-east-2.aws.neon.tech
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
NEON_S3_BUCKET_NAME=resume-storage

# Google Gemini AI Studio
GEMINI_API_KEY=your_gemini_api_key

# GitHub Token (Optional for local dev, used for repository sync)
GITHUB_TOKEN=your_github_personal_access_token
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portfolio.

---

## 🌐 Live Deployment

The portfolio is deployed live at:
- **Primary Domain:** [https://garv767.is-a.dev](https://garv767.is-a.dev)
- **Mirror Domain:** [https://garv.is-a.dev](https://garv.is-a.dev)
