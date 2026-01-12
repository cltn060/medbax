1. **`(marketing)`**: Public marketing site (Landing, About, Pricing). Shares a dedicated **Marketing Layout** (e.g., Navbar + Footer).
2. **`(auth)`**: Authentication flows (Sign-in, Sign-up). Uses a centered **Auth Layout** for a clean, focused experience.
3. **`(dashboard)`**: Protected app section. Split into:
   - User dashboard (for clinics/patients)
   - Admin dashboard (for platform management)
   Shares a base **App Layout** (Sidebar + Header), with potential sub-layouts for role-specific UI.

### Complete Project Architecture

```text
saas-medical/
├── convex/                  # Backend (Convex functions, schema, etc.)
│   ├── schema.ts            # Database schema + vector indexes
│   └── functions/           # Actions, queries, mutations (users, documents, chats, RAG, etc.)
│
├── src/
│   ├── app/                 # App Router (Next.js routing)
│   │   ├── (marketing)/     # Public site – separate root layout possible
│   │   │   ├── layout.tsx   # Marketing Layout (Navbar + Footer)
│   │   │   ├── page.tsx     # Landing page (/)
│   │   │   ├── about/
│   │   │   │   └── page.tsx # /about
│   │   │   └── pricing/
│   │   │       └── page.tsx # /pricing
│   │   │
│   │   ├── (auth)/          # Auth pages – isolated layout
│   │   │   ├── layout.tsx   # Auth Layout (centered, minimal)
│   │   │   ├── sign-in/
│   │   │   │   └── [[...sign-in]]/page.tsx  # Clerk catch-all
│   │   │   └── sign-up/
│   │   │       └── [[...sign-up]]/page.tsx # Clerk catch-all
│   │   │
│   │   ├── (dashboard)/     # Protected app – authenticated via Clerk middleware
│   │   │   ├── dashboard/   # Clinic/User Dashboard
│   │   │   │   ├── layout.tsx   # Optional sub-layout if needed
│   │   │   │   ├── page.tsx         # /dashboard (home)
│   │   │   │   ├── chat/            # AI Medical Chat
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── documents/       # Medical Records / RAG Uploads
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/        # User Settings
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── admin/       # Platform Admin Dashboard
│   │   │       ├── layout.tsx   # Optional admin-specific sub-layout
│   │   │       ├── page.tsx     # /admin (redirect or home)
│   │   │       ├── agents/      # AI Agents Management
│   │   │       │   └── page.tsx
│   │   │       ├── users/       # User Management
│   │   │       │   └── page.tsx
│   │   │       └── subscriptions/ # Billing & Subscriptions
│   │   │           └── page.tsx
│   │   │
│   │   └── layout.tsx       # Root Layout (html/body, providers, ClerkProvider, etc.)
│   │
│   ├── components/
│   │   ├── ui/              # Shadcn/UI or reusable primitives
│   │   ├── marketing/       # Marketing-specific
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── hero.tsx
│   │   ├── dashboard/       # App-specific
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── shell.tsx
│   │   └── forms/           # Reusable forms, etc.
│   │
│   └── lib/                 # Utilities, Convex client, etc.
│       └── convex.ts
│
└── middleware.ts            # Clerk auth protection for /dashboard/* and /admin/*
```