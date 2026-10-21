export const JAKE_RESUME_TEMPLATE = `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,10pt]{article}

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
\\usepackage{fontawesome5}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
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
  \\vspace{-2pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-3pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\ifdefined\\pdfgentounicode
  \\input{glyphtounicode}
  \\pdfgentounicode=1
\\fi

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-5pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-5pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-5pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-4pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape First Last} \\\\ \\vspace{2pt}
    \\small \\faPhone\\ +1 (555) 000-0000 $|$ \\faEnvelope\\ email@example.com $|$ 
    \\faLinkedin\\ \\href{https://linkedin.com/in/username}{\\underline{in/username}} $|$
    \\faGithub\\ \\href{https://github.com/username}{\\underline{github.com/username}} \\\\
    \\vspace{2pt}
    \\small City, State, Country
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {University Name}{City, State}
      {Degree in Major; \\textbf{CGPA / GPA: X.X}}{Month Year -- Month Year}
  \\resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart

    \\resumeSubheading
      {Company Name}{City, State}
      {Job Title / Role}{Month Year -- Month Year}
      \\resumeItemListStart
        \\resumeItem{Engineered robust backend features and data models to optimize software performance and latency by X\\%.}
        \\resumeItem{Designed and implemented intuitive user interfaces and internal dashboards to streamline business operations.}
        \\resumeItem{Collaborated with cross-functional teams to deliver scalable, reliable software components adhering to agile methodologies.}
      \\resumeItemListEnd

  \\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
      
      \\resumeProjectHeading
          {\\textbf{Project Name} $|$ \\emph{Tech Stack, Languages, Libraries} $|$ \\faGithub\\ \\href{https://github.com/username/repo}{\\textbf{GitHub}}}{Month Year -- Month Year}
          \\resumeItemListStart
            \\resumeItem{Architected a scalable full-stack system utilizing modern frameworks, reducing query latency by X\\%.}
            \\resumeItem{Integrated automated REST APIs and backend microservices with rigorous test coverage to ensure high availability.}
          \\resumeItemListEnd

    \\resumeSubHeadingListEnd

%-----------SKILLS & ATTRIBUTES-----------
\\section{Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Core Technologies}{: Languages (e.g. Java, Python, Go, C/C++, JavaScript, SQL)}
     \\vspace{2pt} \\\\
     \\textbf{Frameworks \\& Tools}{: React, Next.js, Node.js, FastAPI, PostgreSQL, Git, GitHub}
     \\vspace{2pt} \\\\
     \\textbf{Engineering Competencies}{: Application Design, Database Modeling, API Integration, Unit Testing, Performance Tuning}
     \\vspace{2pt} \\\\
     \\textbf{Languages}{: Spoken Languages (e.g. English, Native Language)}
    }}
 \\end{itemize}

%-----------ACHIEVEMENTS-----------
\\section{Achievements}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Honor / Competition 1}{: Shortlisted to final round from 600+ teams for competitive proposal.} \\\\
     \\textbf{Award / Recognition 2}{: Selected for presentation round to pitch innovative technology solution.}
    }}
  \\end{itemize}

%-------------------------------------------
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
    {\\Huge\\bfseries First Last} \\\\[3pt]
    \\small\\color{darkgray}
    Email: \\href{mailto:email@example.com}{email@example.com} \\; | \\;
    LinkedIn: \\href{https://linkedin.com/in/username}{in/username} \\; | \\;
    GitHub: \\href{https://github.com/username}{github.com/username}
\\end{center}

\\section{Profile Summary}
Software Engineer specializing in full-stack platforms, distributed systems, and intelligent applications. Experienced in architecting production-grade interfaces, high-concurrency databases, and automated pipelines.

\\section{Technical Stack}
\\begin{itemize}
    \\item \\textbf{Languages:} Python, JavaScript, TypeScript, Go, C++, SQL
    \\item \\textbf{Frameworks:} React, Next.js, Node.js, Express, FastAPI
    \\item \\textbf{Databases \\& Cloud:} PostgreSQL, AWS S3, Docker, Git, Vercel
\\end{itemize}

\\section{Experience}
\\textbf{Company Name} \\hfill \\textbf{Month Year -- Month Year} \\\\
\\emph{Job Title / Role}
\\begin{itemize}
    \\item Engineered scalable web applications with automated data sync and serverless architecture.
    \\item Reduced query latency and optimized relational schemas in PostgreSQL.
\\end{itemize}

\\section{Featured Projects}
\\textbf{Project Title} $|$ \\emph{Tech Stack} \\hfill \\href{https://github.com/username/repo}{Code}
\\begin{itemize}
    \\item Designed robust pipeline processing high-throughput data streams with low latency.
    \\item Built end-to-end classification system achieving high precision on benchmarks.
\\end{itemize}

\\section{Education}
\\textbf{University Name} \\hfill \\textbf{Expected Year} \\\\
\\emph{Degree in Computer Science}

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
{\\textbf{\\LARGE FIRST LAST}} \\\\
\\vspace{2pt}
email@example.com \\; | \\; \\href{https://github.com/username}{github.com/username} \\; | \\; \\href{https://linkedin.com/in/username}{in/username}
\\end{center}
\\vspace{-4pt}
\\hrule
\\vspace{6pt}

\\textbf{TECHNICAL SKILLS} \\\\
\\textbf{Languages:} Java, Python, Go, C/C++, JavaScript, SQL \\\\
\\textbf{Frameworks \\& Tools:} React, Next.js, Node.js, FastAPI, PostgreSQL, AWS S3, Docker, Git

\\vspace{6pt}
\\textbf{EXPERIENCE} \\\\
\\textbf{Company Name} \\hfill Month Year -- Month Year \\\\
\\emph{Software Engineer}
\\begin{itemize}[leftmargin=*]
  \\item Developed distributed cloud applications integrating automated synchronization and APIs.
  \\item Implemented responsive user interfaces with micro-animations and clean architecture.
\\end{itemize}

\\vspace{6pt}
\\textbf{SELECTED PROJECTS} \\\\
\\textbf{Project Title} -- Python, REST API, Machine Learning \\hfill \\href{https://github.com/username/repo}{GitHub}
\\begin{itemize}[leftmargin=*]
  \\item Built real-time detection tool analyzing DOM structures to intercept threats instantaneously.
  \\item Integrated scalable REST API ensuring low-latency threat analysis and seamless communication.
\\end{itemize}

\\vspace{6pt}
\\textbf{EDUCATION} \\\\
\\textbf{Bachelor of Technology in Computer Science} \\hfill Month Year \\\\
Core: Data Structures, Distributed Computing, Database Systems, Computer Networks

\\end{document}
`;

export const TEMPLATES = [
  { key: "jake-resume", name: "Jake's Resume (Industry Standard ATS)", template: JAKE_RESUME_TEMPLATE },
  { key: "modern-tech", name: "Modern Tech (Purple Accent)", template: MODERN_TECH_TEMPLATE },
  { key: "minimal-ats", name: "Minimalist High-Density ATS", template: MINIMAL_TEMPLATE },
];
