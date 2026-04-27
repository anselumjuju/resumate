export const DEFAULT_RESUME = `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}

\\title{\\bf John Doe}
\\author{Software Engineer}
\\date{}

\\begin{document}
\\maketitle

\\section*{Summary}
Experienced software engineer with a passion for building scalable web applications. Focus on clean code, performance, and delivering value to users.

\\section*{Experience}
\\textbf{Senior Developer} \\hfill 2021 - Present \\\\
Company XYZ \\\\
- Led a team of 5 engineers to build a new product resulting in a 30% increase in revenue.
- Architected the transition from monolith to microservices.

\\section*{Education}
\\textbf{B.S. Computer Science} \\hfill 2017 - 2021 \\\\
University of ABC

\\end{document}
`;

export const DEFAULT_COVER_LETTER = `\\documentclass[11pt]{letter}
\\usepackage[margin=1in]{geometry}

\\begin{document}
\\begin{letter}{Hiring Manager \\\\ Company Name \\\\ Company Address}
\\opening{Dear Hiring Manager,}

I am writing to express my interest in the [Position Name] position at [Company Name]. With my background in software engineering and my passion for [Industry/Tech], I am confident that I would be a valuable asset to your team.

At my previous role, I [Significant Achievement]. This experience has equipped me with the skills to [Specific Skill/Task].

Thank you for your time and consideration. I look forward to the possibility of discussing how my skills and experience can benefit [Company Name].

\\closing{Sincerely,\\\\John Doe}
\\end{letter}
\\end{document}
`;
