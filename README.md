# Infinity 8K Corporation — Website

A corporate website + dashboard for a community limited to **8,000 members**, built with:

- **React 19** + **TypeScript** (strict mode)
- **Vite 6** — fast dev server + build
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin
- **React Router v7** — file-based routing with auth guards
- **Supabase** — auth + database
- **Zod** — form validation schemas
- **Lucide React** — icon set

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in your Supabase URL and Anon Key in .env

# 3. Start the dev server
npm run dev
```

---

## Project Structure

```
src/
├── components/         # Reusable UI (Button, Input, Modal, LoginForm, ContactForm)
├── hooks/              # useAuth, useDarkMode
├── layouts/            # LandingLayout, AdminDashboardLayout, MemberDashboardLayout
├── lib/                # utils (cn), constants (ROUTES, APP_NAME), validations (Zod)
├── pages/
│   ├── landing/        # Home, About, Contacts, AdminLogin, MemberLogin
│   ├── admindashboard/ # Admin-only pages (7 pages)
│   └── memberdashboard/# Member-only pages (5 pages)
├── routes/             # Route groups with auth guards
├── services/           # supabase.ts, auth.ts
└── widgets/
    ├── landingwidgets/ # Navbar, Footer, FeatureCard, TeamCard, BrandCarousel
    └── dashboardwidgets/ # SideNav, DashboardNavbar, DashboardFooter
```

---

## Auth Flow

- Users sign in at `/admin/login` or `/member/login`
- Role is stored in Supabase `user_metadata.role`
- `useAuth()` hook reads the session and exposes `{ user, role, loading }`
- Protected routes redirect unauthenticated users back to login

## Supabase Setup

In your Supabase project:
1. Enable **Email Auth** under Authentication → Providers
2. Create users and set `user_metadata: { role: "admin" }` or `{ role: "member" }`
3. Create a `contacts` table with columns: `name`, `email`, `subject`, `message`, `created_at`

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
