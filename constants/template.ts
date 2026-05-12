export const DEFAULT_RESUME = `
\\documentclass[a4paper,20pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[colorlinks=true, urlcolor=black]{hyperref}
\\usepackage[normalem]{ulem}
\\usepackage{fancyhdr}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.530in}
\\addtolength{\\evensidemargin}{-0.375in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1in}

\\urlstyle{rm}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-10pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-2pt}]

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[2]{
  \\item \\small{\\textbf{#1}: #2}
}

\\newcommand{\\resumeItemWithoutTitle}[1]{
  \\item \\small{}
}

\\newcommand{\\resumeSubheading}[4]{
  \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{#3} & \\textit{#4} \\\\
    \\end{tabular*}
}

\\newcommand{\\resumeSubheadingTwo}[2]{
  \\item
  \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
    \\textbf{#1} & #2 \\\\
  \\end{tabular*}
}

\\newcommand{\\resumeSubItem}[2]{\\resumeItem{#1}{#2}\\vspace{-1pt}}

\\renewcommand{\\labelitemii}{$\\circ$}

% Consistent list spacing
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=*, itemsep=1pt, topsep=1pt]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}

\\newcommand{\\resumeItemListStart}{\\begin{itemize}[leftmargin=*, itemsep=1pt, topsep=1pt]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}}

\\newcommand{\\resumeSummary}[1]{
  \\vspace{2pt}
  \\noindent
  {#1}
  \\vspace{6pt}
}

\\newcommand{\\resumeEducation}[4]{
  \\vspace{2pt}
  \\noindent
  \\textbf{#1} \\hfill #2 \\\\
  \\textit{#3} \\hfill \\textit{#4} \\\\
}

%-----------------------------
%%%%%%  CV STARTS HERE  %%%%%%

\\begin{document}

%----------HEADING-----------------
\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
    \\textbf{{\\LARGE Ethan Carter}} \\\\
  
    LinkedIn: \\uline{\\href{https://linkedin.com/in/ethancarterdev}{linkedin.com/in/ethancarterdev}} &
    Email: \\uline{\\href{mailto:ethan.carter.dev@gmail.com}{ethan.carter.dev@gmail.com}} \\\\

    GitHub: \\uline{\\href{https://github.com/ethancarterdev}{github.com/ethancarterdev}} &
    Location: Tamil Nadu, India \\\\

    Portfolio: \\uline{\\href{https://ethancarter.dev}{ethancarter.dev}} &
    Mobile: +91 98765 43210 \\\\
\\end{tabular*}


% ----------Summary---------------
\\section{Summary}
\\resumeSummary{Frontend-focused full-stack developer passionate about building performant and accessible web applications using \\textbf{React.js, Next.js, and TypeScript}. Experienced in developing scalable UI systems, integrating REST APIs, and optimizing user experiences for modern web platforms. Strong interest in developer tooling, design systems, and product-focused engineering.
}

%-----------EDUCATION-----------------
\\section{Education}
\\resumeEducation
  {University of XYZ}
  {TamilNadu, India}
  {Bachelor of Science - Computer Science; GPA: 9.7}
  {Aug 2021 -- May 2025}
\\small{\\textbf{Courses:} Data Structures \\& Algorithms, Software Engineering, Database Systems, Web Programming, Human Computer Interaction, Computer Networks}


%-----------Skills-----------------
\\section{Skills}
\\resumeSubHeadingListStart
	\\resumeSubItem{Languages}{TypeScript, JavaScript, Python, Java, SQL}
	\\resumeSubItem{Frontend}{React.js, Next.js, Tailwind CSS, Redux Toolkit, HTML, CSS}
	\\resumeSubItem{Backend}{Node.js, Express.js, REST APIs, Firebase}
	\\resumeSubItem{Databases}{PostgreSQL, MongoDB, MySQL}
	\\resumeSubItem{Tools}{Git, GitHub, Docker, Postman, Figma, Vercel}
\\resumeSubHeadingListEnd

%-----------Experience-----------------
\\section{Experience}
\\resumeSubHeadingListStart

    \\resumeSubheading
    {Frontend Engineer Intern - BrightLabs}{May 2024 - Aug 2024}
    {Remote}{React.js, TypeScript, Tailwind CSS}
    \\resumeItemListStart
        \\item Developed reusable UI components for an internal analytics platform, improving development consistency across multiple product modules.
        \\item Optimized frontend rendering performance and reduced unnecessary API calls through efficient state management and lazy loading strategies.
    \\resumeItemListEnd

    \\resumeSubheading
    {Software Engineering Intern - NovaStack Systems}{Jan 2024 - Apr 2024}
    {Hybrid}{Next.js, Node.js, PostgreSQL}
    \\resumeItemListStart
        \\item Built full-stack features for a project management platform using Next.js API routes and PostgreSQL.
        \\item Implemented authentication workflows and protected route handling for role-based user access.
        \\item Improved application reliability by introducing centralized API error handling and form validation workflows.
    \\resumeItemListEnd

\\resumeSubHeadingListEnd

%-----------PROJECTS-----------------
\\section{Projects}
\\resumeSubHeadingListStart    

    \\resumeSubheadingTwo    
    {\\uline{\\href{https://github.com/ethancarterdev/sprintflow}{SprintFlow | Team Productivity Platform}}}{Next.js, TypeScript, PostgreSQL}
    \\resumeItemListStart
        \\item Developed a collaborative task management platform supporting project boards, sprint planning, and deadline tracking.
        \\item Implemented real-time task updates and optimized database queries for improved dashboard responsiveness.
    \\resumeItemListEnd
    

    \\resumeSubheadingTwo    
    {\\uline{\\href{https://github.com/ethancarterdev/devspace-ui}{DevSpace UI | Component Library}}}{React.js, Storybook, Tailwind CSS}
    \\resumeItemListStart
        \\item Created a reusable UI component library with accessible and responsive design patterns for web applications.
        \\item Documented component usage with Storybook to improve developer onboarding and design consistency.
    \\resumeItemListEnd
    

    \\resumeSubheadingTwo
    {\\uline{\\href{https://github.com/ethancarterdev/travelnote}{TravelNote | Travel Journal App}}}{React.js, Firebase, Tailwind CSS}
    \\resumeItemListStart
        \\item Built a travel journaling application allowing users to create location-based entries with image uploads.
        \\item Integrated Firebase authentication and cloud storage for secure user data management.
    \\resumeItemListEnd

    \\resumeSubheadingTwo
    {\\uline{\\href{https://github.com/ethancarterdev/fintrack}{FinTrack | Personal Finance Dashboard}}}{Next.js, TypeScript, Chart.js, PostgreSQL}
    \\resumeItemListStart
        \\item Built a personal finance management platform enabling users to track expenses, budgets, and monthly spending trends through interactive dashboards.
        \\item Developed dynamic data visualization components and optimized API-driven analytics for real-time financial insights.
    \\resumeItemListEnd


\\resumeSubHeadingListEnd

%-----------Awards-----------------
\\section{Honors and Awards}
\\resumeSubHeadingListStart
    \\resumeSubItem{Hackathon Winner - CodeFusion 2024}{Led a team in building a real-time collaboration platform and secured first place among 120+ participants.}
    \\resumeSubItem{Dean's List}{Recognized for academic excellence across multiple semesters for maintaining a high GPA.}
\\resumeSubHeadingListEnd

%-----------Certifications-----------------
\\section{Certifications}
\\resumeSubHeadingListStart
    \\resumeSubItem{Meta Front-End Developer Certificate}{Completed coursework covering React.js, responsive design, and frontend architecture.}
    \\resumeSubItem{AWS Cloud Practitioner}{Learned foundational cloud concepts including deployment, scalability, and cloud infrastructure.}
\\resumeSubHeadingListEnd

\\end{document}
`;

export const DEFAULT_COVER_LETTER = `
\\documentclass[11pt]{letter}
\\usepackage[margin=1in]{geometry}
\\usepackage[colorlinks=true, urlcolor=black]{hyperref}
\\usepackage[normalem]{ulem}

\\begin{document}
\\raggedbottom

\\begin{letter}{}
\\opening{Dear Hiring Team,}

I'm excited to apply for this opportunity. I'm a software developer with experience building modern web applications using technologies such as \\textbf{React.js, Next.js, TypeScript, and Node.js}. Through internships and personal projects, I've worked on scalable frontend systems, API integrations, and full-stack applications focused on performance and user experience.

I enjoy creating products that solve practical problems while maintaining clean architecture and intuitive design. My experience includes developing responsive interfaces, building reusable UI components, working with databases, and collaborating across development workflows.

Beyond technical skills, I'm someone who enjoys learning quickly, adapting to new environments, and contributing to team-driven projects. I'm always motivated to improve my engineering skills and build software that delivers meaningful impact.

You can view my projects and portfolio at \\uline{\\href{https://ethancarter.dev}{ethancarter.dev}}.

\\closing{Sincerely,\\\\Ethan Carter}

\\end{letter}

\\end{document}
`;
