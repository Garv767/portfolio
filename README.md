<h1 align="center">
  <br>
  Garv Rahut — Personal Portfolio & AI Resume Studio
  <br>
</h1>

<p align="center">
  Modern, full-stack developer portfolio, dynamic project CMS, and LaTeX-powered AI Resume Studio.
</p>

<p align="center">
  <a href="https://garvrahut.tech" target="_blank">
    <strong>🌐 Live Domain: garvrahut.tech</strong>
  </a>
</p>

<div align="center">

[![Live Site](https://img.shields.io/badge/Live_Site-garvrahut.tech-623686?style=for-the-badge&logo=google-chrome&logoColor=white)](https://garvrahut.tech)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Neon Database](https://img.shields.io/badge/Neon-PostgreSQL_%26_S3-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)

</div>

---

## 📸 Admin Project Management (Accordion View)

Easily manage repository visibility, custom titles, live URLs, custom thumbnails, and priority ranking using fluid drag-and-drop reordering with accordion controls:

<div align="center">
  <img src="./public/admin-accordion.png" alt="Admin Dashboard Accordion and Drag-and-Drop Management" width="850" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" />
</div>

---

## ✨ Key Features

### 1. 🗂️ Interactive Project Management
- **Drag-and-Drop Priority Reordering:** Seamlessly drag repositories to reorder their showcase priority on the live portfolio.
- **Accordion Control:** Fine-tune custom titles, override live demo links (or fallback automatically to GitHub repo homepages), and attach custom social previews.
- **Neon PostgreSQL Sync:** Syncs GitHub repos directly to Neon PostgreSQL, preserving visibility and custom metadata.

### 2. 📄 Dynamic Public Resume Display
- **Admin Resume Selector:** Rather than hardcoding static PDFs in `public/`, the admin selects which saved resume from Neon database to publish.
- **Live PDF Compilation & Serving:** Automatically serves and streams the compiled PDF on `/resume` via dynamic API (`/api/resumes/published-pdf`).

### 3. ⚡ AI Resume Studio
- **Overleaf-Style 3-Panel IDE:** Resizable split panels for **Files / Master Context**, **LaTeX Monaco Editor**, and **Live PDF Preview**.
- **Save & Save As:** Overwrite existing resume records or create distinct versions with a single click.
- **Neon S3 + PostgreSQL:** Stores raw `.tex` source documents securely in Neon S3 storage with metadata indexed in PostgreSQL.
- **AI Tailoring:** Uses Google Gemini to analyze Master Context and target Job Descriptions, crafting ATS-optimized LaTeX resumes.

### 4. 📊 Inverted GitHub Activity Heat Map
- About page features an activity heat map from GitHub with an inverted, high-contrast theme suited for dark mode.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React 18)
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
Create a `.env.local` file with the following keys:
```env
# Neon Database & S3
DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require
NEON_DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require
AWS_ENDPOINT_URL_S3=https://s3.us-east-2.amazonaws.com
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
NEON_S3_BUCKET_NAME=your_bucket_name

# AI Studio
GEMINI_API_KEY=your_gemini_api_key

# Admin Authentication
ADMIN_SECRET_KEY=your_admin_secret_key
NEXT_PUBLIC_ADMIN_USER=admin
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portfolio.

---

## 🌐 Live Deployment

The portfolio is deployed with custom domain support:
- **Primary Domain:** [https://garvrahut.tech](https://garvrahut.tech)
- **GitHub Pages:** [https://garv767.github.io](https://garv767.github.io)
