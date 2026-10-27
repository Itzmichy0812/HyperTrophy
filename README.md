# HyperTrophy — Fitness Tracking Web Application

**HyperTrophy** is a full-stack web application designed to help users organize training routines, log daily workouts, and monitor strength progression over time. 

Built as an independent software engineering project, the application focuses on type-safe full-stack workflows, secure user data isolation, and component-level testability.

---

## Key Features

- **User Authentication:** Secure sign-up and sign-in workflows powered by Supabase Authentication.
- **Exercise Management:** Browse and organize exercises to build structured workouts.
- **Training Plans:** Create and customize workout routines tailored to specific training goals.
- **Workout Logging:** Record sets, repetitions, and weights during workout sessions.
- **Progress Tracking:** Review historical workout logs and track training consistency over time.

---

## Tech Stack

- **Framework & Frontend:** Next.js, React, TypeScript
- **Backend & Data Mutations:** Next.js Server Actions
- **Database & Auth:** Supabase, PostgreSQL with Row-Level Security (RLS)
- **Testing:** Vitest, React Testing Library

---

## Architecture & Implementation Highlights

- **Server-Side Mutations:** Uses Next.js Server Actions to handle form submissions and database mutations directly on the server without redundant API boilerplate.
- **Data Isolation via RLS:** Enforces PostgreSQL Row-Level Security policies in Supabase so authenticated users can only read and modify their own training plans and workout logs.
- **Component Testing:** Includes unit and component tests written with Vitest and React Testing Library to verify core UI behavior.

---

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18+ recommended) and `npm`
- A [Supabase](https://supabase.com/) project for database and authentication services

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Itzmichy0812/HyperTrophy.git](https://github.com/Itzmichy0812/HyperTrophy.git)
   cd HyperTrophy
