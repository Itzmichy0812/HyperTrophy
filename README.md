# HyperTrophy — Fitness Tracking Web Application

**HyperTrophy** is an independent full-stack web application designed to help users organize training routines, log workout sessions, and track physical progress over time.

Built as an individual software engineering project, the application focuses on type-safe full-stack development, secure user data isolation, and component-level testing.

---

## Key Features

- **Exercise Management:** Browse, create, and organize exercises with structured categories and target muscle groups.
- **Training Plans:** Build and customize structured workout routines tailored to specific training goals.
- **Workout Logging:** Record daily workout sessions, including sets, repetitions, and weights lifted.
- **Progress Tracking:** View historical workout data and monitor training consistency over time.
- **Authentication & Data Isolation:** Secure user sign-up and sign-in workflows powered by Supabase Authentication and PostgreSQL Row-Level Security (RLS).

---

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend & Data Fetching:** Next.js Server Actions, Supabase Client
- **Database & Security:** PostgreSQL (via Supabase), Row-Level Security (RLS), Supabase Auth
- **Testing:** Vitest, React Testing Library
- **Version Control & Tooling:** Git, GitHub, npm

---

## Architecture Highlights

- **Independent Full-Stack Design:** Designed and implemented end-to-end as an individual project, covering UI layout, server-side mutations, and relational database modeling.
- **Server-Side Mutations:** Uses Next.js Server Actions to handle form submissions and data updates between the React frontend and Supabase backend.
- **Database-Level Security:** Enforces PostgreSQL Row-Level Security (RLS) policies so authenticated users can only access and modify their own workout records and training plans.
- **Component Testing:** Includes component tests written with Vitest and React Testing Library to verify core interface behaviors.

---

## Getting Started (Local Development)

### Prerequisites
- **Node.js** (v18 or later recommended)
- **npm**
- A **Supabase** project (PostgreSQL database and Authentication credentials)

### Installation & Setup

1. **Clone the repository:**
   - Run: `git clone https://github.com/Itzmichy0812/HyperTrophy.git`
   - Run: `cd HyperTrophy`

2. **Install dependencies:**
   - Run: `npm install`

3. **Configure environment variables:**
   - Create a `.env.local` file in the root directory and add your Supabase project credentials:
   - `NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`

4. **Start the development server:**
   - Run: `npm run dev`
   - Open `http://localhost:3000` in your browser.

5. **Run component tests:**
   - Run: `npm test`

---

## Author

**Tran Hong Quang**  
Computer Science Undergraduate at Ho Chi Minh City University of Technology (HCMUT)  
- **GitHub:** [https://github.com/Itzmichy0812](https://github.com/Itzmichy0812)  
- **LinkedIn:** [https://www.linkedin.com/in/tranhongquang0812/](https://www.linkedin.com/in/tranhongquang0812/)
