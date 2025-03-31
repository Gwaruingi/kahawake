// MongoDB script to generate 100 job listings
// Run this in MongoDB shell or using mongosh

// Connect to your database
// use wazitodb

// First, let's find an admin user to set as the job poster
// If you don't have an admin user, you'll need to create one or use an existing user ID
db.users.findOne({ role: "admin" }, { _id: 1 })

// Sample job data
const companies = [
  {
    name: "TechCorp",
    locations: ["San Francisco, CA", "New York, NY", "Austin, TX", "Remote"],
    jobTypes: ["full-time", "contract", "internship"],
    salaryRanges: [
      { min: 80000, max: 120000 },
      { min: 100000, max: 150000 },
      { min: 120000, max: 180000 },
      { min: 150000, max: 220000 }
    ],
    jobTitles: [
      "Software Engineer",
      "Senior Software Engineer",
      "Full Stack Developer",
      "Frontend Developer",
      "Backend Developer",
      "DevOps Engineer",
      "Data Scientist",
      "Machine Learning Engineer",
      "Product Manager",
      "UX/UI Designer"
    ]
  },
  {
    name: "Global Brands",
    locations: ["Chicago, IL", "Los Angeles, CA", "Miami, FL", "Remote"],
    jobTypes: ["full-time", "part-time", "contract"],
    salaryRanges: [
      { min: 60000, max: 90000 },
      { min: 70000, max: 110000 },
      { min: 90000, max: 130000 },
      { min: 110000, max: 160000 }
    ],
    jobTitles: [
      "Marketing Manager",
      "Brand Strategist",
      "Digital Marketing Specialist",
      "Content Creator",
      "Social Media Manager",
      "E-commerce Manager",
      "Sales Representative",
      "Account Manager",
      "Customer Success Manager",
      "Business Analyst"
    ]
  },
  {
    name: "Investment Partners",
    locations: ["New York, NY", "Boston, MA", "Chicago, IL", "Remote"],
    jobTypes: ["full-time", "contract"],
    salaryRanges: [
      { min: 90000, max: 130000 },
      { min: 120000, max: 180000 },
      { min: 150000, max: 220000 },
      { min: 200000, max: 300000 }
    ],
    jobTitles: [
      "Financial Analyst",
      "Investment Banker",
      "Portfolio Manager",
      "Risk Analyst",
      "Compliance Officer",
      "Quantitative Analyst",
      "Wealth Manager",
      "Investment Advisor",
      "Financial Planner",
      "Equity Research Analyst"
    ]
  }
];

// Job descriptions and requirements templates
const jobDescriptionTemplates = [
  "We are seeking a talented and motivated %JOB_TITLE% to join our dynamic team at %COMPANY%. In this role, you will be responsible for developing and implementing innovative solutions to complex problems. You will work closely with cross-functional teams to deliver high-quality products that meet our clients' needs.\n\nAs a %JOB_TITLE%, you will have the opportunity to work on challenging projects that have a direct impact on our business and customers. We offer a collaborative and inclusive work environment where your ideas and contributions are valued.",
  
  "%COMPANY% is looking for an experienced %JOB_TITLE% to help us drive our business forward. This is an exciting opportunity to join a growing company and make a significant impact. You will be responsible for designing, developing, and implementing solutions that address our business challenges.\n\nWe are a team of passionate professionals committed to excellence and innovation. If you are a creative problem-solver with a strong work ethic, we want to hear from you.",
  
  "Join %COMPANY% as a %JOB_TITLE% and be part of a team that is transforming the industry. In this role, you will leverage your expertise to develop and implement strategies that drive growth and innovation. You will collaborate with talented professionals across the organization to achieve our business objectives.\n\nWe offer a competitive salary, comprehensive benefits, and opportunities for professional development and advancement."
];

const requirementsTemplates = {
  "Software Engineer": [
    "Bachelor's degree in Computer Science or related field",
    "3+ years of experience in software development",
    "Proficiency in JavaScript, TypeScript, and React",
    "Experience with Node.js and Express",
    "Knowledge of database systems like MongoDB or PostgreSQL",
    "Strong problem-solving skills and attention to detail"
  ],
  "Senior Software Engineer": [
    "Bachelor's degree in Computer Science or related field",
    "5+ years of experience in software development",
    "Expert knowledge of JavaScript, TypeScript, and modern frameworks",
    "Experience with system design and architecture",
    "Strong leadership and mentoring skills",
    "Experience with CI/CD pipelines and DevOps practices"
  ],
  "Full Stack Developer": [
    "Bachelor's degree in Computer Science or related field",
    "3+ years of experience in full stack development",
    "Proficiency in both frontend and backend technologies",
    "Experience with React, Node.js, and database systems",
    "Knowledge of RESTful APIs and microservices",
    "Strong problem-solving skills and ability to work independently"
  ],
  "Frontend Developer": [
    "Bachelor's degree in Computer Science or related field",
    "2+ years of experience in frontend development",
    "Proficiency in HTML, CSS, JavaScript, and React",
    "Experience with responsive design and cross-browser compatibility",
    "Knowledge of state management libraries like Redux or Context API",
    "Eye for design and attention to detail"
  ],
  "Backend Developer": [
    "Bachelor's degree in Computer Science or related field",
    "3+ years of experience in backend development",
    "Proficiency in Node.js, Express, and database systems",
    "Experience with RESTful APIs and microservices",
    "Knowledge of security best practices",
    "Strong problem-solving skills and analytical thinking"
  ],
  "DevOps Engineer": [
    "Bachelor's degree in Computer Science or related field",
    "3+ years of experience in DevOps or SRE",
    "Experience with cloud platforms like AWS, Azure, or GCP",
    "Knowledge of containerization and orchestration (Docker, Kubernetes)",
    "Experience with CI/CD pipelines and automation tools",
    "Strong problem-solving skills and ability to work under pressure"
  ],
  "Data Scientist": [
    "Master's degree in Data Science, Statistics, or related field",
    "3+ years of experience in data science or analytics",
    "Proficiency in Python, R, and SQL",
    "Experience with machine learning frameworks and libraries",
    "Strong statistical knowledge and analytical skills",
    "Excellent communication and data visualization skills"
  ],
  "Machine Learning Engineer": [
    "Master's degree in Computer Science, AI, or related field",
    "3+ years of experience in machine learning or AI",
    "Proficiency in Python and machine learning frameworks",
    "Experience with deep learning and neural networks",
    "Knowledge of data processing and feature engineering",
    "Strong mathematical and statistical skills"
  ],
  "Product Manager": [
    "Bachelor's degree in Business, Computer Science, or related field",
    "3+ years of experience in product management",
    "Strong understanding of product development lifecycle",
    "Experience with agile methodologies and project management",
    "Excellent communication and leadership skills",
    "Ability to translate business requirements into technical specifications"
  ],
  "UX/UI Designer": [
    "Bachelor's degree in Design, HCI, or related field",
    "3+ years of experience in UX/UI design",
    "Proficiency in design tools like Figma, Sketch, or Adobe XD",
    "Experience with user research and usability testing",
    "Strong portfolio demonstrating design thinking and problem-solving",
    "Excellent communication and collaboration skills"
  ],
  "Marketing Manager": [
    "Bachelor's degree in Marketing, Business, or related field",
    "5+ years of experience in marketing",
    "Experience developing and implementing marketing strategies",
    "Knowledge of digital marketing channels and analytics",
    "Strong leadership and project management skills",
    "Excellent communication and presentation skills"
  ],
  "Brand Strategist": [
    "Bachelor's degree in Marketing, Business, or related field",
    "3+ years of experience in brand strategy or marketing",
    "Experience developing brand positioning and messaging",
    "Knowledge of market research and consumer insights",
    "Strong analytical and creative thinking skills",
    "Excellent communication and presentation skills"
  ],
  "Digital Marketing Specialist": [
    "Bachelor's degree in Marketing, Communications, or related field",
    "2+ years of experience in digital marketing",
    "Experience with SEO, SEM, and social media marketing",
    "Knowledge of marketing analytics and reporting tools",
    "Experience with content management systems",
    "Strong analytical and problem-solving skills"
  ],
  "Content Creator": [
    "Bachelor's degree in English, Communications, or related field",
    "2+ years of experience in content creation or copywriting",
    "Strong writing and editing skills",
    "Experience with SEO and content strategy",
    "Knowledge of content management systems",
    "Creative thinking and attention to detail"
  ],
  "Social Media Manager": [
    "Bachelor's degree in Marketing, Communications, or related field",
    "3+ years of experience in social media management",
    "Experience developing and implementing social media strategies",
    "Knowledge of social media analytics and reporting",
    "Experience with content creation and community management",
    "Strong communication and creative thinking skills"
  ],
  "E-commerce Manager": [
    "Bachelor's degree in Business, Marketing, or related field",
    "3+ years of experience in e-commerce or digital retail",
    "Experience managing online stores and product listings",
    "Knowledge of e-commerce platforms and payment systems",
    "Strong analytical and problem-solving skills",
    "Experience with digital marketing and customer acquisition"
  ],
  "Sales Representative": [
    "Bachelor's degree in Business, Marketing, or related field",
    "2+ years of experience in sales",
    "Strong communication and negotiation skills",
    "Experience with CRM systems and sales tools",
    "Goal-oriented with a track record of meeting targets",
    "Excellent customer service skills"
  ],
  "Account Manager": [
    "Bachelor's degree in Business, Marketing, or related field",
    "3+ years of experience in account management or sales",
    "Strong relationship-building and communication skills",
    "Experience with client retention and growth strategies",
    "Knowledge of CRM systems and account planning",
    "Problem-solving skills and attention to detail"
  ],
  "Customer Success Manager": [
    "Bachelor's degree in Business, Communications, or related field",
    "3+ years of experience in customer success or account management",
    "Strong communication and relationship-building skills",
    "Experience with customer onboarding and retention strategies",
    "Knowledge of CRM systems and customer support tools",
    "Problem-solving skills and ability to work under pressure"
  ],
  "Business Analyst": [
    "Bachelor's degree in Business, Finance, or related field",
    "3+ years of experience in business analysis",
    "Strong analytical and problem-solving skills",
    "Experience with data analysis and reporting tools",
    "Knowledge of business processes and requirements gathering",
    "Excellent communication and presentation skills"
  ],
  "Financial Analyst": [
    "Bachelor's degree in Finance, Economics, or related field",
    "3+ years of experience in financial analysis",
    "Strong analytical and quantitative skills",
    "Experience with financial modeling and forecasting",
    "Knowledge of accounting principles and financial statements",
    "Proficiency in Excel and financial analysis tools"
  ],
  "Investment Banker": [
    "Bachelor's degree in Finance, Economics, or related field",
    "5+ years of experience in investment banking",
    "Strong financial modeling and valuation skills",
    "Experience with M&A, capital raising, or advisory services",
    "Knowledge of financial markets and industry trends",
    "Excellent communication and presentation skills"
  ],
  "Portfolio Manager": [
    "Bachelor's degree in Finance, Economics, or related field",
    "5+ years of experience in portfolio management or investment analysis",
    "Strong understanding of investment strategies and asset allocation",
    "Experience with risk management and performance analysis",
    "Knowledge of financial markets and economic indicators",
    "Excellent analytical and decision-making skills"
  ],
  "Risk Analyst": [
    "Bachelor's degree in Finance, Mathematics, or related field",
    "3+ years of experience in risk analysis or management",
    "Strong analytical and quantitative skills",
    "Experience with risk assessment and mitigation strategies",
    "Knowledge of regulatory requirements and compliance",
    "Proficiency in statistical analysis and risk modeling"
  ],
  "Compliance Officer": [
    "Bachelor's degree in Law, Finance, or related field",
    "3+ years of experience in compliance or regulatory affairs",
    "Strong knowledge of financial regulations and compliance requirements",
    "Experience with compliance monitoring and reporting",
    "Attention to detail and strong ethical standards",
    "Excellent communication and documentation skills"
  ],
  "Quantitative Analyst": [
    "Master's degree in Mathematics, Statistics, or related field",
    "3+ years of experience in quantitative analysis",
    "Strong mathematical and statistical skills",
    "Experience with financial modeling and algorithm development",
    "Proficiency in programming languages like Python or R",
    "Knowledge of financial markets and trading strategies"
  ],
  "Wealth Manager": [
    "Bachelor's degree in Finance, Economics, or related field",
    "5+ years of experience in wealth management or financial advisory",
    "Strong understanding of investment strategies and financial planning",
    "Experience with client relationship management",
    "Knowledge of tax planning and estate planning",
    "Excellent communication and interpersonal skills"
  ],
  "Investment Advisor": [
    "Bachelor's degree in Finance, Economics, or related field",
    "3+ years of experience in investment advisory or wealth management",
    "Strong understanding of investment products and strategies",
    "Experience with client relationship management",
    "Knowledge of financial planning and risk assessment",
    "Excellent communication and interpersonal skills"
  ],
  "Financial Planner": [
    "Bachelor's degree in Finance, Economics, or related field",
    "3+ years of experience in financial planning",
    "Strong understanding of personal finance and investment strategies",
    "Experience with retirement planning and tax strategies",
    "Knowledge of insurance products and estate planning",
    "Excellent communication and interpersonal skills"
  ],
  "Equity Research Analyst": [
    "Bachelor's degree in Finance, Economics, or related field",
    "3+ years of experience in equity research or investment analysis",
    "Strong financial modeling and valuation skills",
    "Experience with industry and company analysis",
    "Knowledge of financial markets and accounting principles",
    "Excellent analytical and writing skills"
  ]
};

// Find an admin user to set as the job poster
// Replace this with an actual user ID from your database
// const adminUserId = db.users.findOne({ role: "admin" }, { _id: 1 })._id;
// If you don't have an admin user, you can use this placeholder and replace it later
const adminUserId = ObjectId("67de82f591a43501e0b7123e");

// Generate 100 job listings
const jobs = [];
let jobCount = 0;

// Distribute jobs evenly among the three companies
while (jobCount < 100) {
  for (const company of companies) {
    if (jobCount >= 100) break;
    
    const jobTitle = company.jobTitles[Math.floor(Math.random() * company.jobTitles.length)];
    const location = company.locations[Math.floor(Math.random() * company.locations.length)];
    const jobType = company.jobTypes[Math.floor(Math.random() * company.jobTypes.length)];
    const salaryRange = company.salaryRanges[Math.floor(Math.random() * company.salaryRanges.length)];
    const descriptionTemplate = jobDescriptionTemplates[Math.floor(Math.random() * jobDescriptionTemplates.length)];
    
    // Replace placeholders in description
    const description = descriptionTemplate
      .replace(/%JOB_TITLE%/g, jobTitle)
      .replace(/%COMPANY%/g, company.name);
    
    // Get requirements for this job title
    const requirements = requirementsTemplates[jobTitle] || [
      "Bachelor's degree in a relevant field",
      "3+ years of experience in a similar role",
      "Strong communication and interpersonal skills",
      "Ability to work independently and as part of a team",
      "Problem-solving skills and attention to detail"
    ];
    
    jobs.push({
      title: jobTitle,
      company: company.name,
      location: location,
      description: description,
      requirements: requirements,
      salary: {
        min: salaryRange.min,
        max: salaryRange.max,
        currency: "USD"
      },
      type: jobType,
      status: "active",
      postedBy: adminUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    jobCount++;
  }
}

// Insert the jobs into the database
db.jobs.insertMany(jobs);

// Verify the insertion
print(`Successfully inserted ${jobs.length} job listings.`);
