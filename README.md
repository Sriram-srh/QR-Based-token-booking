# SmartMeal QR – Hostel Food Queue & Meal Management System

SmartMeal QR is a web-based hostel meal management system built to reduce queue time, improve meal distribution, and replace manual token handling with secure QR verification. The platform supports pre-booking, real-time meal tracking, and role-based dashboards for students, staff, and administrators.

It is designed as a recruiter-friendly full-stack project with a clean UI, Supabase-backed data flow, and a practical workflow for meal booking, token generation, and scanner-based validation. The repository is structured to make setup, deployment, and demo review straightforward.

## Features

- QR-based meal token generation and verification
- Pre-booking system for upcoming meals
- Role-based authentication for students, staff, and admins
- Real-time meal and token tracking
- Admin dashboard for meal, counter, and user management
- Staff verification interface for QR scanning
- Notifications, billing, and audit log support

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Supabase
- PostgreSQL
- Tailwind CSS
- Radix UI
- QR code generation and scanning utilities

## Screenshots

Add production screenshots in the `screenshots/` folder with clear filenames such as:

- `screenshots/login-page.png`
- `screenshots/student-dashboard.png`
- `screenshots/qr-token.png`
- `screenshots/admin-dashboard.png`
- `screenshots/scanner-interface.png`

If you are preparing this for a portfolio or resume, include the most visually useful screens near the top of the repository and in the README.

## Project Structure

```text
smartmeal-qr/
├── app/
├── components/
├── lib/
├── public/
├── screenshots/
├── scripts/
├── styles/
├── types/
├── README.md
├── package.json
└── .env.example
```

## Installation

```bash
git clone <repo-link>
cd smartmeal-qr
npm install
npm run dev
```

If your environment has React 19 peer dependency issues with `qrcode.react`, use the repository's preferred install flow with legacy peer dependencies:

```bash
npm install --legacy-peer-deps
```

## Environment Variables

Create a `.env.local` file from `.env.example` and set the values for your Supabase project.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_NAME=SmartMeal QR
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never commit real service keys or production secrets to GitHub.

## Database Setup

The repository includes Supabase SQL scripts under `scripts/` for initialization, seed data, RLS, notifications, and token automation. Run them in the documented order when setting up a fresh database.

## Deployment

Deploy the app to Vercel or Netlify and replace the placeholder below with your live demo URL.

## Live Demo

https://your-project.vercel.app

## Future Enhancements

- Mobile app integration
- AI-based demand prediction
- Payment gateway support
- Exportable reports and analytics
- Automated notification scheduling

## Resume Summary

SmartMeal QR - Hostel Food Queue & Meal Management System

Next.js, React, TypeScript, Supabase, PostgreSQL

Developed a QR-based meal booking and verification system for hostel food management.
Implemented role-based authentication for students, staff, and administrators.
Designed real-time meal tracking and pre-booking features to reduce queue time and food wastage.
Built a responsive frontend and integrated backend APIs using Supabase.

GitHub: <add-your-repo-link>

Live Demo: https://your-project.vercel.app

## License

This project is licensed under the MIT License.
