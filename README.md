# Cosmic Commerce Platform + Self-Healing AI Agent

## Problem Statement: Agentic AI for Self-Healing Support During Headless E-commerce Migration

### The Challenge

E-commerce SaaS companies migrating merchants from fully hosted platforms to headless architectures face a critical support crisis:

- **Broken checkouts** disrupting merchant revenue
- **Misconfigured APIs** causing silent failures
- **Missing webhooks** breaking order fulfillment
- **Frontend-backend mismatches** creating inconsistent behavior
- **Support ticket floods** overwhelming teams before patterns are recognized

By the time issues are identified, dozens of merchants are already affected.

### Our Solution

An **Agentic AI system** that acts as a self-healing support layer, observing signals across the system, reasoning about root causes, and coordinating action across support, product, and engineering—**before issues escalate**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENTIC AI SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   OBSERVE    │───▶│    REASON    │───▶│    DECIDE    │───▶│    ACT    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│         │                   │                   │                   │       │
│         ▼                   ▼                   ▼                   ▼       │
│  • Support tickets    • Root cause        • Action type        • Execute   │
│  • API failures         analysis          • Confidence         • Escalate  │
│  • Checkout errors    • Pattern           • Risk level         • Mitigate  │
│  • Webhook logs         matching          • Human approval     • Document  │
│  • Migration stage    • Classification      required?          • Notify    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXPLAINABILITY DASHBOARD                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  • What the agent believes is happening                                     │
│  • Why it believes so (evidence chain)                                      │
│  • Proposed actions with impact assessment                                  │
│  • Uncertainty levels and assumptions                                       │
│  • Human approval interface for high-risk actions                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COSMIC COMMERCE PLATFORM (Headless)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Next.js 15 │ Supabase │ Stripe │ REST APIs │ Webhooks │ Merchant Stores   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Custom RBAC with PBKDF2 hashing |
| **Payments** | Stripe |
| **UI** | Tailwind CSS 4 + shadcn/ui |
| **Agent** | Custom state machine + Claude API |

---

## Getting Started

### Prerequisites

- Node.js 18.17 or higher
- Supabase account (free tier works)
- Stripe account (test mode)

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd cyberCypher-NMIMS-Adv.-Track-P1
npm install --legacy-peer-deps
```

### Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your credentials in `.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@host:5432/postgres

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Claude API (for agent reasoning)
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 3: Run Database Migrations

You need to run the SQL migrations in your Supabase project:

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Migration 1: Agent Schema**
   - Open `supabase/migrations/001_agent_schema.sql` from this project
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Run Migration 2: Auth Schema**
   - Open `supabase/migrations/002_auth_schema.sql` from this project
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

5. **Verify Tables Created**
   - Go to "Table Editor" in Supabase
   - You should see tables like: `users`, `merchants`, `support_tickets`, `incidents`, `agent_actions`, etc.

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Access the Application

| URL | Description |
|-----|-------------|
| [http://localhost:3000](http://localhost:3000) | Customer storefront |
| [http://localhost:3000/auth/login](http://localhost:3000/auth/login) | Login page (all roles) |
| [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup) | Register (customer/merchant) |
| [http://localhost:3000/admin](http://localhost:3000/admin) | Agent dashboard (admin only) |
| [http://localhost:3000/merchant](http://localhost:3000/merchant) | Merchant dashboard |

---

## Authentication System

### Overview

Industrial-grade authentication with Role-Based Access Control (RBAC):

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User ──▶ Login Page ──▶ Auth API ──▶ Session Created          │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                         │
│                    │ Password Check  │                         │
│                    │ (PBKDF2 100K)   │                         │
│                    └────────┬────────┘                         │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                         │
│                    │ Role & Perms    │                         │
│                    │ Loaded          │                         │
│                    └────────┬────────┘                         │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                         │
│                    │ Session Token   │                         │
│                    │ (Hashed in DB)  │                         │
│                    └─────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### User Roles

| Role | Access Level | How to Create |
|------|--------------|---------------|
| **Customer** | Store, cart, orders, wishlist, profile | Self-registration |
| **Merchant** | Merchant dashboard, products, orders, analytics | Self-registration |
| **Support** | Support dashboard, tickets, agent panel | Admin creates |
| **Admin** | Full system access, user management | Admin creates |

### Security Features

| Feature | Implementation |
|---------|----------------|
| Password Hashing | PBKDF2 with 100,000 iterations + random salt |
| Session Tokens | Cryptographically secure, SHA-256 hashed in DB |
| Account Lockout | 5 failed attempts = 30 minute lock |
| Password Policy | 8+ chars, uppercase, lowercase, number, special char |
| Session Expiry | 24 hours (7 days with "remember me") |
| Audit Logging | All auth events logged with IP and user agent |
| Role-Based Access | Granular permissions per role |
| Route Protection | Middleware validates session on every request |

### Auth API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Register new customer/merchant |
| `/api/auth/signin` | POST | Authenticate and create session |
| `/api/auth/session` | GET | Validate session, get user & permissions |
| `/api/auth/signout` | POST | Invalidate session |

### Creating Admin/Support Users

Admin and support accounts cannot self-register. To create them:

1. First create a regular account via signup
2. Go to Supabase Dashboard → Table Editor → `users`
3. Find the user and change `role` from `customer` to `admin` or `support`
4. Also update `status` to `active` and `email_verified` to `true`

---

## Agent System

### Agent Loop

The AI agent follows a continuous loop:

1. **OBSERVE**: Collect signals from tickets, API errors, webhook failures, checkout issues
2. **REASON**: Analyze patterns and identify root causes using LLM
3. **DECIDE**: Select appropriate actions based on confidence and risk
4. **ACT**: Execute actions (with human approval for high-risk operations)

### Agent API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/run` | POST | Trigger one agent cycle |
| `/api/agent/run` | GET | Get agent status |
| `/api/agent/actions` | GET | List pending actions |
| `/api/agent/actions` | POST | Approve/reject action |
| `/api/agent/mock-data` | POST | Generate test data |

### Using the Agent Dashboard

1. Go to `/admin` (requires admin login)
2. Click "Generate Mock Data" to create test data
3. Click "Simulate Crisis" to create a spike of errors
4. Click "Run Agent" to trigger the observe-reason-decide-act loop
5. Review detected incidents and pending actions
6. Approve or reject recommended actions

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   ├── session/
│   │   │   └── signout/
│   │   ├── agent/             # Agent endpoints
│   │   │   ├── run/
│   │   │   ├── actions/
│   │   │   └── mock-data/
│   │   └── payment-intent/    # Stripe payments
│   ├── admin/                 # Agent dashboard
│   ├── auth/                  # Login/signup pages
│   ├── merchant/              # Merchant dashboard
│   ├── cart/
│   ├── checkout/
│   ├── products/
│   └── ...
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── ...
├── context/
│   ├── AuthContext.tsx        # Authentication state
│   ├── CartContext.tsx
│   └── WishlistContext.tsx
├── lib/
│   ├── auth/                  # Auth service
│   │   ├── auth-service.ts
│   │   └── types.ts
│   ├── agent/                 # Agent core
│   │   ├── observer.ts
│   │   ├── reasoner.ts
│   │   ├── decider.ts
│   │   ├── actor.ts
│   │   ├── state.ts
│   │   └── mock-data.ts
│   ├── supabase.ts
│   └── stripe.ts
├── middleware.ts              # Route protection
└── ...

supabase/
└── migrations/
    ├── 001_agent_schema.sql   # Agent & merchant tables
    └── 002_auth_schema.sql    # Auth & RBAC tables
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles |
| `user_sessions` | Active sessions |
| `permissions` | Granular permissions |
| `role_permissions` | Role-permission mappings |
| `merchants` | Merchant/store data |
| `support_tickets` | Support tickets for agent |
| `incidents` | Detected issues |
| `agent_actions` | Proposed/executed actions |
| `reasoning_logs` | Agent thought process |

### Key Relationships

```
users ─┬─▶ customer_profiles
       ├─▶ merchant_profiles
       ├─▶ support_profiles
       └─▶ admin_profiles

merchants ──▶ support_tickets ──▶ incidents ──▶ agent_actions
                                      │
                                      └──▶ reasoning_logs
```

---

## Implementation Roadmap

### Phase 1: Foundation ✅
- [x] Agent database schema
- [x] Mock data generator
- [x] Signal ingestion pipeline
- [x] Agent state management
- [x] Authentication system (RBAC)

### Phase 2: Agent Core ✅
- [x] Observer module
- [x] Reasoner module
- [x] Decider module
- [x] Actor module

### Phase 3: Dashboards
- [x] Admin/Agent dashboard
- [ ] Merchant dashboard
- [ ] Support dashboard

### Phase 4: Integration
- [ ] Connect to live signals
- [ ] LLM integration for reasoning
- [ ] Real-time updates
- [ ] Performance optimization

---

## Key Differentiators

1. **Not just a chatbot** - Full agent loop with state, memory, and multi-step reasoning
2. **Explainable AI** - Every decision shows evidence chain and confidence levels
3. **Human-in-the-loop** - Critical actions require approval, building trust
4. **Proactive, not reactive** - Detects patterns before tickets flood in
5. **Industrial-grade auth** - RBAC, audit logging, secure sessions
6. **Domain-specific** - Tailored for e-commerce migration challenges

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Team

**CyberCypher** - NMIMS Advanced Track

---

## License

This project is for the CyberCypher hackathon - educational purposes.
