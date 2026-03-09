# Feature Readiness Report

> Generated: 2026-03-08 — Reference document for upcoming feature implementation.

---

## 1. Funnels (Product + Subdomain)

### Concept

A **funnel** is a standalone sales page where a user creates a product, configures a form, and gets a unique URL. Funnel products are **separate from integration (Shopify) products** — they are created manually inside the app. A future bridge feature will allow importing an integration store product into a funnel.

### Current State

| Component | Status | Notes |
|---|---|---|
| Form builder | ✅ Ready | Full config: offers, shipping, variants, promo codes, urgency, trust badges, etc. |
| Funnel entity | ❌ Missing | No `funnels` collection or concept in schema |
| Funnel products | ❌ Missing | Products are Shopify-only (`ProductsPage.tsx` fetches via Shopify API). No manual product creation |
| Standalone page | ❌ Missing | Forms only render via Shopify loader injection (`finalform-loader.prod.js`) |
| Funnel URL routing | ❌ Missing | No client-side or server-side routing for funnel pages |

### What to Prepare

#### Firestore Schema

```
users/{userId}/funnels/{funnelId}
├── name: string
├── slug: string                    # URL-friendly identifier
├── status: "draft" | "published"
├── productId: string               # ref → users/{userId}/funnel_products/{id}
├── formId: string                   # ref → users/{userId}/forms/{id}
├── subdomain: string               # e.g. "my-offer" → my-offer.yourdomain.com
├── customDomain?: string           # optional, e.g. "shop.example.com"
├── createdAt, updatedAt
└── analytics?: { views, orders, conversionRate }

users/{userId}/funnel_products/{productId}
├── title: string
├── description: string
├── price: number
├── compareAtPrice?: number
├── images: string[]
├── variants: { id, title, price, sku, image? }[]
├── source: "manual" | "imported"
├── importedFrom?: { platform, originalId }   # for bridge feature
└── createdAt, updatedAt
```

> **Key distinction:** `funnel_products` is a separate collection from integration products. Integration products live in `users/{userId}/products/` and come from Shopify sync. Funnel products are user-created.

#### Funnel URL Resolution

**Option A: Client-side routing (simplest)**
- Funnels live under a path like `yourdomain.com/f/{slug}` or `yourdomain.com/p/{slug}`
- Uses existing React Router — add a public route that loads the funnel config
- No DNS/infrastructure changes needed
- Lookup: server endpoint resolves `slug` → `funnelId` → form config

**Option B: Subdomain routing (premium)**
- Funnels live at `{slug}.yourdomain.com`
- Requires wildcard DNS (`*.yourdomain.com`)
- Requires edge routing (Cloudflare Workers / Vercel Edge / custom proxy)
- More complex but gives users a cleaner, branded URL

**Recommendation:** Start with **Option A** (route-based), add **Option B** later as a premium feature.

#### Standalone Form Renderer

The existing form preview/renderer needs to work as a **full standalone page**, not just an in-app preview or Shopify injection:

1. **New Vite entry point** — `standalone.html` + `standalone.tsx` that renders a form given a funnel config
2. **Public config endpoint** — `GET /api/funnel/{slug}` returns the resolved form config + product data
3. **SEO** — The standalone page needs `<title>`, meta tags, OG tags derived from the product

#### Frontend (Dashboard)

1. **New "Funnels" page** — List, create, edit, delete funnels
2. **Funnel creation wizard** — Pick/create product → configure form → choose slug → publish
3. **Funnel product manager** — CRUD for manual products (separate from Shopify products page)
4. **Import from store** (future bridge) — Select a Shopify product → copy its data into `funnel_products`

#### Server

1. `funnel.controller.ts` — CRUD for funnels
2. `funnel.service.ts` — Firestore operations, slug validation/uniqueness
3. `funnel_domains/{slug}` lookup collection for O(1) resolution
4. Public config endpoint for standalone rendering

#### Firestore Rules Addition

```
match /users/{userId}/funnels/{funnelId} {
  allow read: if true;  // public read for standalone renderer
  allow write: if isOwner(userId);
}

match /users/{userId}/funnel_products/{productId} {
  allow read: if true;  // public read for standalone renderer
  allow write: if isOwner(userId);
}

match /funnel_domains/{slug} {
  allow read: if true;  // public lookup
  allow create, update, delete: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
}
```

---

## 2. Custom Domain Linking

### Current State

No domain management exists. The only domain concept is `shopDomain` (`.myshopify.com`).

### What to Prepare

#### Firestore Schema

```
users/{userId}/custom_domains/{domainId}
├── domain: string                  # e.g. "shop.example.com"
├── funnelId: string                # which funnel this domain points to
├── verified: boolean
├── verificationToken: string       # e.g. "solvix-verify=abc123"
├── verificationMethod: "CNAME" | "TXT"
├── sslStatus: "pending" | "active" | "failed"
├── createdAt, verifiedAt
```

#### Verification Flow

1. User enters domain → system generates verification token
2. User adds DNS records:
   - `CNAME` pointing domain to your hosting
   - `TXT` record with verification token
3. Server checks DNS resolution (polling or on-demand)
4. Once verified → mark domain active, start serving funnel

#### Infrastructure Options

| Option | Pros | Cons |
|---|---|---|
| **Cloudflare for SaaS** | Automatic SSL, edge routing, scalable | Requires Cloudflare enterprise or pro plan |
| **Caddy server** | Auto TLS with Let's Encrypt, simple config | Self-hosted, needs a VPS |
| **Firebase Hosting** | Already in use | Limited custom domain support, not ideal for dynamic user domains |
| **Vercel** | Easy custom domains API | Costs scale with usage |

#### Server Endpoints

- `POST /api/domains` — Register a custom domain
- `GET /api/domains/verify/{domainId}` — Check DNS verification status
- `DELETE /api/domains/{domainId}` — Remove custom domain

---

## 3. Plans & Offline Payment

### Current State

**100% hardcoded dummy data.** No real plan system exists.

| Component | Status | Details |
|---|---|---|
| Plan data | ❌ Hardcoded | `SettingsPage.tsx`: static "Pro Plan", "824 orders", "28 days left" |
| Plan in sidebar | ❌ Hardcoded | `HomePage.tsx`: `{ name: 'Pro Plan', daysLeft: 28, totalDays: 30 }` |
| User plan storage | ❌ Missing | No `plan` field on user document |
| Payments collection | ❌ Missing | No payment tracking |
| Feature gating | ❌ Missing | No order limits, no funnel limits, nothing enforced |

### What to Prepare

#### Firestore Schema

```
users/{userId}                      # Add to existing user doc
├── plan: {
│     id: "free" | "starter" | "pro" | "enterprise"
│     name: string
│     startDate: Timestamp
│     endDate: Timestamp
│     status: "active" | "expired" | "pending" | "suspended"
│     ordersUsed: number
│     limits: {
│       orders: number              # per billing period
│       funnels: number
│       forms: number
│       customDomains: number
│       integrations: number
│     }
│   }

users/{userId}/payments/{paymentId}
├── amount: number
├── currency: string                # "DZD"
├── planId: string                  # which plan they're paying for
├── method: "ccp" | "baridimob" | "cash" | "other"
├── status: "pending" | "confirmed" | "rejected"
├── proof?: string                  # URL to uploaded receipt image
├── paymentDetails?: string         # CCP transaction ref, etc.
├── confirmedBy?: string            # admin userId
├── notes?: string
├── createdAt, confirmedAt
```

#### Plan Tiers (to be defined)

| Feature | Free | Starter | Pro |
|---|---|---|---|
| Forms | ? | ? | ? |
| Funnels | ? | ? | ? |
| Orders/month | ? | ? | Unlimited |
| Custom domains | ❌ | ? | ✅ |
| Integrations | 1 | ? | Unlimited |
| Price (DZD) | 0 | ? | ? |

> **Decision needed:** Define exact limits and pricing before implementation.

#### Frontend Changes

1. **Replace hardcoded plan data** in `SettingsPage.tsx` and `HomePage.tsx` with real Firestore data
2. **Plans selection page** — Show available tiers with pricing comparison
3. **Payment request flow:**
   - Select plan → show payment instructions (CCP number, BaridiMob, etc.)
   - Upload payment proof (receipt screenshot)
   - Show status: "Pending Confirmation" / "Active" / "Rejected"
4. **Feature gating hooks** — `usePlanLimits()` hook that checks current plan before operations

#### Admin Confirmation

Options for confirming offline payments:
1. **Admin page in app** — Protected route, only your UID can access
2. **Firestore console** — Manually change `status` to `confirmed` (quick MVP)
3. **Cloud Function trigger** — When payment `status` changes → auto-update user plan

#### Server / Cloud Functions

1. **Plan enforcement middleware** — Check plan limits before creating forms, funnels, etc.
2. **Scheduled function** — Daily check for expired plans, downgrade to free
3. **Payment webhook** (future) — If you ever add online payment gateways

---

## Implementation Priority

```
Phase 1: Plans (offline payment)
  └── Most self-contained, no infrastructure changes needed
  └── Unblocks monetization immediately

Phase 2: Funnel Products
  └── Manual product creation UI
  └── Separate from Shopify products
  └── Prerequisite for funnels

Phase 3: Funnels with Route-Based URLs
  └── Funnel entity + standalone renderer
  └── /f/{slug} routing (no DNS changes)
  └── Bridge: import from integration store

Phase 4: Subdomains + Custom Domains
  └── Wildcard DNS setup
  └── Edge routing / proxy
  └── Custom domain verification + SSL
```

---

## Files That Will Need Changes

### Plans
- `src/pages/SettingsPage.tsx` — Replace hardcoded subscription tab
- `src/pages/HomePage.tsx` — Replace hardcoded plan prop
- `src/components/DashboardHeader.tsx` — Read real plan data
- `firestore.rules` — Add payment collection rules
- New: plan hooks, payment upload component, admin panel

### Funnels
- `src/App.tsx` — Add funnel routes (dashboard + public)
- `firestore.rules` — Add funnel + funnel_product rules
- New: FunnelsPage, FunnelEditor, FunnelProductManager, standalone renderer
- `server/src/` — New funnel controller, service, routes

### Custom Domains
- `firestore.rules` — Add custom_domains rules
- New: domain management UI, verification endpoints
- Infrastructure: DNS + SSL solution
