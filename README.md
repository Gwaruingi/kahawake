# Job Portal Web Application

A modern job portal built with Next.js, MongoDB, and TypeScript, designed to connect job seekers with employers.

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Database**: MongoDB Atlas
- **Authentication**: NextAuth.js
- **Email Service**: Resend
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation

## Features

- User authentication (Admin & Job Seekers)
- Job posting and management
- Job application system
- Resume upload functionality
- Email notifications
- Responsive design

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=your_resend_api_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
job-portal/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── ...               # Other app routes
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
├── models/               # MongoDB models
└── types/                # TypeScript type definitions
```

## Development

- Use `npm run lint` to check for linting issues
- Use `npm run build` to create a production build
- Use `npm run start` to run the production server

## License

MIT
