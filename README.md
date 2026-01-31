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

## Agent Loop Implementation

### 1. OBSERVE - Signal Ingestion

The agent continuously monitors:

| Signal Type | Source | Data Points |
|-------------|--------|-------------|
| Support Tickets | Ticket system | Category, keywords, merchant ID, frequency |
| API Errors | Platform logs | Endpoint, error code, merchant, timestamp |
| Checkout Failures | Stripe webhooks | Payment status, error reason, cart data |
| Webhook Failures | Event logs | Delivery status, retry count, payload |
| Migration Status | Migration DB | Stage, completion %, blockers |
| Merchant Behavior | Analytics | Session drops, cart abandonment spikes |

### 2. REASON - Root Cause Analysis

The agent classifies issues into categories:

| Category | Indicators | Example |
|----------|------------|---------|
| **Migration Misstep** | Issue started post-migration, affects specific migration batch | API endpoint changed but merchant not updated |
| **Platform Regression** | Affects multiple merchants simultaneously, recent deployment | New release broke checkout flow |
| **Documentation Gap** | Repeated tickets with same question, correct setup but wrong expectation | Webhook format not documented |
| **Merchant Config Error** | Single merchant, setup deviation from standard | Missing API key in environment |

### 3. DECIDE - Action Selection

Based on reasoning, the agent decides:

| Action Type | Confidence Required | Human Approval |
|-------------|---------------------|----------------|
| Auto-reply to ticket | High (>85%) | No |
| Proactive merchant alert | Medium (>70%) | No |
| Suggest documentation update | Medium (>60%) | Yes |
| Escalate to engineering | Any | Yes |
| Apply temporary mitigation | High (>90%) | Yes (for payments) |
| Rollback recommendation | Any | Always |

### 4. ACT - Execution with Boundaries

Actions are executed with:
- **Confidence scores** (0-100%)
- **Risk assessment** (Low/Medium/High/Critical)
- **Audit trail** for all actions
- **Rollback capability** for reversible actions
- **Human-in-the-loop** for money/trust-sensitive operations

---

## Tech Stack

### E-Commerce Platform (Existing)
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **UI**: Tailwind CSS 4 + shadcn/ui

### Agentic AI System (To Build)
- **Agent Framework**: LangGraph / Custom state machine
- **LLM**: Claude API for reasoning
- **Vector Store**: Supabase pgvector for ticket similarity
- **Event Processing**: Real-time Supabase subscriptions
- **Dashboard**: Next.js admin panel

---

## Project Structure

```
src/
├── app/                          # E-commerce platform pages
│   ├── api/                      # API routes
│   │   ├── payment-intent/       # Stripe payments
│   │   └── agent/                # Agent API endpoints (to build)
│   │       ├── observe/          # Signal ingestion
│   │       ├── reason/           # Root cause analysis
│   │       ├── decide/           # Action selection
│   │       └── act/              # Action execution
│   ├── admin/                    # Agent dashboard (to build)
│   │   ├── dashboard/            # Main overview
│   │   ├── tickets/              # Ticket analysis
│   │   ├── incidents/            # Active incidents
│   │   └── actions/              # Action approval queue
│   └── [existing pages...]
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── agent/                    # Agent UI components (to build)
│       ├── ConfidenceMeter.tsx
│       ├── ReasoningChain.tsx
│       ├── ActionApproval.tsx
│       └── IncidentTimeline.tsx
├── lib/
│   ├── agent/                    # Agent core logic (to build)
│   │   ├── observer.ts           # Signal collection
│   │   ├── reasoner.ts           # LLM-powered analysis
│   │   ├── decider.ts            # Action selection
│   │   ├── actor.ts              # Action execution
│   │   └── state.ts              # Agent state management
│   ├── supabase.ts
│   └── stripe.ts
└── context/
    ├── CartContext.tsx
    ├── WishlistContext.tsx
    └── AgentContext.tsx          # Agent state context (to build)
```

---

## Database Schema (Agent Tables)

```sql
-- Support tickets ingested by the agent
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  subject TEXT,
  body TEXT,
  category TEXT,
  status TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ
);

-- Incidents detected by the agent
CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  type TEXT,  -- migration_misstep, platform_regression, doc_gap, config_error
  severity TEXT,  -- low, medium, high, critical
  affected_merchants UUID[],
  root_cause TEXT,
  confidence FLOAT,
  evidence JSONB,
  status TEXT,  -- detected, investigating, mitigating, resolved
  created_at TIMESTAMPTZ
);

-- Actions proposed/taken by the agent
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY,
  incident_id UUID REFERENCES incidents(id),
  action_type TEXT,
  description TEXT,
  confidence FLOAT,
  risk_level TEXT,
  requires_approval BOOLEAN,
  approved_by UUID,
  executed_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ
);

-- Agent reasoning logs for explainability
CREATE TABLE reasoning_logs (
  id UUID PRIMARY KEY,
  incident_id UUID REFERENCES incidents(id),
  step INTEGER,
  thought TEXT,
  evidence JSONB,
  conclusion TEXT,
  created_at TIMESTAMPTZ
);
```

---

## Getting Started

### Prerequisites

- Node.js 18.17 or higher
- Supabase account
- Stripe account
- Claude API key (for agent reasoning)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cyberCypher-NMIMS-Adv.-Track-P1
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**

   Copy the example env file:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=your-database-url

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   STRIPE_SECRET_KEY=your-stripe-secret-key

   # Claude API (for agent)
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Implementation Roadmap

### Phase 1: Foundation
- [ ] Set up agent database tables in Supabase
- [ ] Create mock support ticket data
- [ ] Build basic signal ingestion pipeline
- [ ] Implement agent state management

### Phase 2: Agent Core
- [ ] Build Observer module (signal collection)
- [ ] Build Reasoner module (LLM-powered analysis)
- [ ] Build Decider module (action selection)
- [ ] Build Actor module (action execution)

### Phase 3: Explainability Dashboard
- [ ] Create admin dashboard layout
- [ ] Build incident visualization
- [ ] Implement reasoning chain display
- [ ] Add action approval workflow

### Phase 4: Integration & Testing
- [ ] Connect agent to live platform signals
- [ ] Test with simulated migration scenarios
- [ ] Validate human-in-the-loop workflows
- [ ] Performance optimization

---

## Key Differentiators

1. **Not just a chatbot** - Full agent loop with state, memory, and multi-step reasoning
2. **Explainable AI** - Every decision shows evidence chain and confidence levels
3. **Human-in-the-loop** - Critical actions require approval, building trust
4. **Proactive, not reactive** - Detects patterns before tickets flood in
5. **Domain-specific** - Tailored for e-commerce migration challenges

---

## Team

CyberCypher - NMIMS Advanced Track

---

## License

This project is for the CyberCypher hackathon - educational purposes.
