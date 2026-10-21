export const JAKE_RESUME_TEMPLATE = `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape Garv Rahut} \\\\ \\vspace{2pt}
    \\small +91-XXXXXXXXXX $|$ \\href{mailto:garvrahut@example.com}{\\underline{garvrahut@example.com}} $|$ 
    \\href{https://linkedin.com/in/garv}{\\underline{linkedin.com/in/garv}} $|$
    \\href{https://github.com/garv767}{\\underline{github.com/garv767}} $|$
    \\href{https://garv767.github.io}{\\underline{portfolio}}
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
  \\textbf{Bachelor of Technology in Computer Science \\& Engineering} \\hfill Expected 2026 \\\\
  \\emph{Specialization in Intelligent Systems \\& Software Engineering} \\\\
  \\small Relevant Coursework: Data Structures \\& Algorithms, Distributed Systems, Database Management Systems, Operating Systems, Machine Learning

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: Python, JavaScript, TypeScript, C++, SQL, HTML/CSS} \\\\
     \\textbf{Frameworks \\& Libraries}{: React, Next.js, Node.js, Express, Bootstrap, PyTorch, Pandas, Scikit-Learn} \\\\
     \\textbf{Databases \\& Cloud}{: PostgreSQL (Neon DB/Auth), Redis, AWS S3, Docker, Git, Vercel} \\\\
     \\textbf{Core Competencies}{: RESTful APIs, Distributed Data Processing, NLP Systems, Full-Stack Architecture}
    }}
 \\end{itemize}

%-----------EXPERIENCE-----------
\\section{Experience}
  \\textbf{Full Stack \\& Software Engineering Fellow} \\hfill 2024 -- Present \\\\
  \\emph{Independent / Applied Research Projects} \\\\
  \\begin{itemize}[leftmargin=0.15in]
    \\item Designed and deployed high-performance full-stack web applications serving real-time analytics with sub-200ms latency.
    \\item Implemented resilient cloud data synchronization pipelines integrating third-party REST APIs and automated database webhooks.
    \\item Formulated responsive UI/UX architectures utilizing modern state management and glassmorphic micro-animations.
  \\end{itemize}

%-----------PROJECTS-----------
\\section{Selected Projects}
  \\textbf{Social NLP Dataset \\& Analytics Engine} $|$ \\emph{Python, PyTorch, Pandas, NLP} \\hfill \\href{https://github.com/garv767}{\\underline{GitHub}} \\\\
  \\begin{itemize}[leftmargin=0.15in]
    \\item Built an end-to-end NLP preprocessing and classification pipeline for social media engagement datasets exceeding 2M+ records.
    \\item Implemented custom tokenization, TF-IDF vectorization, and sentiment extraction achieving 94.2\\% classification accuracy.
    \\item Optimized batch execution through vectorized operations, reducing data ingestion cycle time by 60\\%.
  \\end{itemize}
  \\vspace{2pt}

  \\textbf{Cloud-Native Portfolio \\& Automated Sync Platform} $|$ \\emph{React, Next.js, Neon PostgreSQL, S3} \\hfill \\href{https://github.com/garv767}{\\underline{GitHub}} \\\\
  \\begin{itemize}[leftmargin=0.15in]
    \\item Engineered serverless architecture with live GitHub metadata synchronization into Neon serverless PostgreSQL.
    \\item Integrated S3-compatible cloud object storage for dynamic context retrieval, eliminating static rebuild dependencies.
    \\item Architected real-time LaTeX compilation sub-engine yielding sub-1.2s document compilation and live PDF previews.
  \\end{itemize}

%-----------ACHIEVEMENTS-----------
\\section{Certifications \\& Achievements}
 \\begin{itemize}[leftmargin=0.15in]
    \\item Developed open-source developer tooling and datasets actively published on GitHub.
    \\item Solved 300+ algorithmic problems across LeetCode, Codeforces, and HackerRank focusing on graph algorithms and dynamic programming.
 \\end{itemize}

\\end{document}
`;

export const MODERN_TECH_TEMPLATE = `\\documentclass[letterpaper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=0.6in}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{xcolor}

\\definecolor{primary}{RGB}{98, 0, 238}
\\definecolor{darkgray}{RGB}{50, 50, 50}

\\hypersetup{
    colorlinks=true,
    linkcolor=primary,
    urlcolor=primary,
}

\\titleformat{\\section}{\\large\\bfseries\\color{primary}}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{8pt}{4pt}

\\setlist[itemize]{leftmargin=*,noitemsep,topsep=2pt}

\\begin{document}
\\pagestyle{empty}

% HEADER
\\begin{center}
    {\\Huge\\bfseries Garv Rahut} \\\\[3pt]
    \\small\\color{darkgray}
    Email: \\href{mailto:garvrahut@example.com}{garvrahut@example.com} \\; | \\;
    Portfolio: \\href{https://garv767.github.io}{garv767.github.io} \\; | \\;
    GitHub: \\href{https://github.com/garv767}{github.com/garv767}
\\end{center}

\\section{Profile Summary}
Software Engineer specializing in full-stack platforms, distributed systems, and intelligent NLP applications. Experienced in architecting production-grade React/Next.js interfaces, high-concurrency PostgreSQL databases, and data processing pipelines.

\\section{Technical Stack}
\\begin{itemize}
    \\item \\textbf{Languages:} Python, JavaScript (ES6+), TypeScript, C++, SQL
    \\item \\textbf{Frameworks:} React, Next.js, Node.js, Express, Bootstrap
    \\item \\textbf{Data \\& AI:} PyTorch, Pandas, Scikit-Learn, Vectorization, NLP
    \\item \\textbf{Cloud \\& DevOps:} Neon PostgreSQL/Auth, AWS S3, Docker, Git, Vercel
\\end{itemize}

\\section{Experience}
\\textbf{Software Engineering Projects} \\hfill \\textbf{2024 -- Present} \\\\
\\emph{Full-Stack Engineering \\& Distributed Pipelines}
\\begin{itemize}
    \\item Engineered scalable web applications with automated data sync and serverless architecture.
    \\item Architected high-throughput data processing workflows handling large-scale social datasets.
    \\item Reduced query latency and optimized relational schemas in Neon serverless PostgreSQL.
\\end{itemize}

\\section{Featured Projects}
\\textbf{Social NLP Dataset Engine} $|$ \\emph{Python, PyTorch, Pandas} \\hfill \\href{https://github.com/garv767}{Code}
\\begin{itemize}
    \\item Designed NLP classification framework for multi-million row text data with automated sentiment labeling.
    \\item Optimized model training loops and feature extraction, accelerating data transformation by 60\\%.
\\end{itemize}

\\vspace{3pt}
\\textbf{Automated Portfolio \\& Cloud Sync System} $|$ \\emph{React, Neon Postgres, S3} \\hfill \\href{https://github.com/garv767}{Code}
\\begin{itemize}
    \\item Built real-time GitHub repository synchronization engine updating PostgreSQL records on demand.
    \\item Integrated cloud object storage for dynamic context management with zero downtime.
\\end{itemize}

\\section{Education}
\\textbf{Bachelor of Technology in Computer Science} \\hfill \\textbf{Expected 2026} \\\\
\\emph{Relevant Coursework:} Algorithms, Distributed Systems, Operating Systems, Machine Learning

\\end{document}
`;

export const MINIMAL_TEMPLATE = `\\documentclass[letterpaper,10pt]{article}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\hypersetup{colorlinks=true, urlcolor=black}
\\setlist{nosep}

\\begin{document}
\\pagestyle{empty}

\\begin{center}
{\\textbf{\\LARGE GARV RAHUT}} \\\\
\\vspace{2pt}
garvrahut@example.com \\; | \\; \\href{https://github.com/garv767}{github.com/garv767} \\; | \\; \\href{https://garv767.github.io}{portfolio}
\\end{center}
\\vspace{-4pt}
\\hrule
\\vspace{6pt}

\\textbf{TECHNICAL SKILLS} \\\\
\\textbf{Languages:} Python, JavaScript, TypeScript, C++, SQL, Bash \\\\
\\textbf{Frameworks \\& Tools:} React, Next.js, Node.js, Express, PostgreSQL, AWS S3, Docker, Git, PyTorch

\\vspace{6pt}
\\textbf{EXPERIENCE} \\\\
\\textbf{Software Engineering Projects} \\hfill 2024 -- Present \\\\
\\emph{Independent Developer}
\\begin{itemize}[leftmargin=*]
  \\item Developed distributed cloud applications integrating automated synchronization with GitHub API and Neon PostgreSQL.
  \\item Architected NLP data pipelines processing and labeling 2M+ data points with 94\\% benchmark precision.
  \\item Implemented responsive, modern web interfaces with micro-animations and serverless architecture.
\\end{itemize}

\\vspace{6pt}
\\textbf{SELECTED PROJECTS} \\\\
\\textbf{Social NLP Analytics Engine} -- Python, PyTorch, Pandas \\hfill \\href{https://github.com/garv767}{github.com/garv767}
\\begin{itemize}[leftmargin=*]
  \\item Built automated NLP sentiment analysis pipeline processing high-throughput dataset streams.
  \\item Reduced pipeline latency by 60\\% using optimized vectorized vector transformations.
\\end{itemize}

\\vspace{4pt}
\\textbf{Portfolio Sync \\& Storage Engine} -- React, Neon Postgres, S3 \\hfill \\href{https://github.com/garv767}{github.com/garv767}
\\begin{itemize}[leftmargin=*]
  \\item Automated GitHub repository tracking into PostgreSQL database with live administrative controls.
  \\item Integrated S3-compatible bucket storage for seamless document versioning and context ingestion.
\\end{itemize}

\\vspace{6pt}
\\textbf{EDUCATION} \\\\
\\textbf{B.Tech in Computer Science and Engineering} \\hfill Expected 2026 \\\\
Core: Data Structures, Distributed Computing, Database Systems, Computer Networks

\\end{document}
`;

export const TEMPLATES = [
  { key: "jake-resume", name: "Jake's Resume (Industry Standard)", template: JAKE_RESUME_TEMPLATE },
  { key: "modern-tech", name: "Modern Tech (Purple Accent)", template: MODERN_TECH_TEMPLATE },
  { key: "minimal-ats", name: "Minimalist High-Density ATS", template: MINIMAL_TEMPLATE },
];
