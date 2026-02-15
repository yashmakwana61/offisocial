# Offisocial - Anonymous Employee Social Platform
Verified, professional, and completely anonymous.

## Overview

Offisocial is an MVP for a private, employee-only, anonymous social platform designed to provide psychological safety, peer support, and career help for employees. The platform explicitly excludes founders, owners, and C-level executives to create a safe space for individual contributors and non-executive managers.

**Core Principles:**
- Employees only (no founders/owners/C-level)
- Anonymous by default - verified privately, anonymous publicly
- No naming or exposing individuals
- Mental-health-aware, calm UX design
- Focus on support and career help, not gossip

**Key Features:**
- Employee verification via Replit Auth
- Company-based private communities
- Anonymous posting and commenting with category filtering
- Reaction system (support/helpful)
- Profile management with role declaration

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack React Query for server state
- **Styling:** Tailwind CSS with shadcn/ui component library (New York style)
- **Animations:** Framer Motion for page transitions
- **Form Handling:** React Hook Form with Zod validation
- **Build Tool:** Vite with custom plugins for Replit integration

**Design Decisions:**
- shadcn/ui chosen for accessible, customizable components with consistent design
- Calm color palette (slate/sage/blue-grey) for mental-health-aware UX
- Custom fonts: Outfit (display) and Inter (body) for readability

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript with ES modules
- **API Design:** RESTful endpoints defined in `shared/routes.ts`
- **Authentication:** Replit Auth (OpenID Connect) with Passport.js
- **Session Management:** Express sessions with PostgreSQL store (connect-pg-simple)

**Design Decisions:**
- Shared route definitions between frontend and backend for type safety
- Zod schemas for request/response validation
- Anonymous-first design - user identity masked in public-facing data

### Data Storage
- **Database:** PostgreSQL via Drizzle ORM
- **Schema Location:** `shared/schema.ts` and `shared/models/auth.ts`
- **Migrations:** Drizzle Kit with `drizzle-kit push` command

**Key Tables:**
- `users` - Auth user data (managed by Replit Auth)
- `sessions` - Session storage (managed by Replit Auth)
- `profiles` - App-specific user data linked to users
- `companies` - Company entities with domain verification
- `posts` - Anonymous posts with categories
- `comments` - Anonymous comments on posts
- `reactions` - Support/helpful reactions on posts and comments
- `reports` - Content moderation reports

### Authentication Flow
1. Replit Auth handles OIDC authentication
2. User data synced to `users` table on login
3. App-specific profile created in `profiles` table during onboarding
4. Session stored in PostgreSQL for persistence

### Project Structure
```
├── client/              # React frontend
│   └── src/
│       ├── components/  # UI components including shadcn/ui
│       ├── hooks/       # React Query hooks for data fetching
│       ├── pages/       # Route components
│       └── lib/         # Utilities
├── server/              # Express backend
│   ├── replit_integrations/auth/  # Replit Auth integration
│   ├── routes.ts        # API route handlers
│   └── storage.ts       # Database operations
├── shared/              # Shared code between frontend/backend
│   ├── schema.ts        # Drizzle database schema
│   ├── routes.ts        # API contract definitions
│   └── models/auth.ts   # Auth-related models
└── migrations/          # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL** - Primary database (provisioned via Replit)
- **Drizzle ORM** - Type-safe database queries
- **connect-pg-simple** - Session storage in PostgreSQL

### Authentication
- **Replit Auth** - OpenID Connect authentication provider
- **Passport.js** - Authentication middleware
- **express-session** - Session management

### UI Components
- **Radix UI** - Headless accessible component primitives
- **shadcn/ui** - Pre-styled component library built on Radix
- **Lucide React** - Icon library
- **Tailwind CSS** - Utility-first CSS framework

### Data Handling
- **TanStack React Query** - Server state management
- **Zod** - Schema validation
- **drizzle-zod** - Zod schema generation from Drizzle

### Development Tools
- **Vite** - Frontend build tool with HMR
- **esbuild** - Server bundling for production
- **TypeScript** - Type safety across the stack

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `ISSUER_URL` - Replit OIDC issuer (defaults to https://replit.com/oidc)
- `REPL_ID` - Replit environment identifier