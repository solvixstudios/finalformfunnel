# System Architect & Extensibility Audit Prompt

**Role:** Senior Principal Software Architect
**Context:** You are auditing "FinalForm", a specialized "Generic & Extensible" E-commerce Order Management & P&L Tracking System tailored for the Algerian market. The architecture spans a React/TypeScript Frontend (including a dynamic `FormLoader`), a Backend (Firebase/Node), and complex n8n Workflow Automation (handling Shopify sync, Google Sheets, WhatsApp, Meta/TikTok CAPI, etc.).
**Objective:** Deconstruct the application's core abstractions, validate the integrity of data flows across the stack, and provide a prioritized roadmap for architectural perfection.

---

## Phase 1: The "Generic Core" Analysis
**Output Artifact:** `ARCHITECTURE.md` (Root Directory)

1.  **Abstraction Audit**:
    *   **The "Generic" Promise**: Analyze how the app achieves its generic nature (e.g., Unified Form Management, Store Configs, global Product assignments). Are the foundations truly agnostic (via dynamic components, configuration schemas, or polymorphic structures) or just a facade?
    *   **Leakage Detection**: Identify areas where domain-specific logic has leaked into core generic components (e.g., hardcoded entity IDs, vendor-specific conditional logic like Shopify vs. WooCommerce, or rigid client constraints).
    *   **Extensibility Mechanisms**: Document *exactly* how a developer adds a new feature (e.g., a new Form Type, a new platform Integration like TikTok CAPI, or a new Data Model) without modifying the core engine.

2.  **Full-Stack Data Mapping**:
    *   Trace the complete lifecycle of key data entities: **Orders**, **Leads**, **Products**, and **Store Configurations**.
    *   **Cross-Boundary Integrity**: Perform a rigorous check of TypeScript Interfaces (Frontend) vs. Firebase schemas vs. JSON Payloads (n8n Webhooks). *Are they strictly synchronized? Where do schemas drift (e.g., between `FormLoader.tsx` submissions and n8n tables)?*
    *   **Visualizations**: Create detailed Mermaid.js sequence diagrams depicting the flow: `User Action (Form Submit) -> FormLoader State -> Webhook -> n8n Workflow (e.g., Shopify_Submit_Order) -> External Service (Google Sheets/CAPI) -> DB Update -> Frontend Sync (ProductsPage)`.

3.  **Component & Workflow Coupling**:
    *   Analyze the interaction between the frontend (`src/components`, `src/lib/sync/syncService.ts`, form loaders) and the n8n automations (e.g., `src/workflows-temp`).
    *   Evaluate the coupling: How does the frontend "know" about workflows and their expected payloads for concepts like Abandoned Orders or Meta Pixels? Is there a shared contract (like Zod schemas or shared TS types), or is it tightly and implicitly coupled?

## Phase 2: Vulnerability, Performance & Logic Pitfalls
**Focus:** Reliability, Data Safety, & Scalability

1.  **State Desynchronization & Race Conditions**:
    *   Identify scenarios where the Frontend State (e.g., Store Connections, Assigned Forms), the Firebase Database, and the n8n Workflow might disagree on the source of truth (e.g., leftover `store_configs` in n8n after disconnection).
    *   Look for missing optimistic UI updates or vulnerable asynchronous operations without proper locking/rollbacks (especially around CRUD flows and sync functions).
2.  **Error Propagation & Resilience**:
    *   Audit the failure handling chain: `Failed n8n node -> Webhook Response -> Frontend Error Boundary/UI Notification`.
    *   Do users receive actionable feedback on silent backend failures (e.g., Google Sheets CORS issues or CAPI token expirations)? Are there retry mechanisms?
3.  **Redundancy & DRY Violations**:
    *   Spot logic duplicated across the stack (e.g., calculating P&L metrics or RTO risk scores in both React and an n8n IF/Code node).
4.  **Performance & Scaling Bottlenecks**:
    *   Identify expensive n8n operations (e.g., large data loops processing split profiles, synchronous HTTP waits for external generic APIs) that could block the frontend.
    *   Locate unoptimized React renders (e.g., excessive re-renders in `ProductsPage.tsx`) or excessive Firebase listener triggers.

## Phase 3: The Optimization Roadmap
**Output Requirement:** A strategic, generic framework matrix ranked by **Impact** vs. **Effort**.

1.  **Architectural Refactoring**:
    *   Propose robust design patterns (e.g., "Adapter Pattern" for n8n triggers like Shopify/TikTok, "Facade Pattern" for complex P&L queries) to standardize interactions.
    *   Suggest generic wrapper components or custom React hooks to eliminate boilerplate and consolidate business logic (e.g., a unified `useN8nSync` hook).

2.  **Maintenance & Developer Experience (DX)**:
    *   Enforce a ubiquitous language and standardized naming conventions (e.g., preventing `pixel_id` in n8n from being `pixelId` in React and `pixel_ID` in Firebase).
    *   Recommend a strategy for extracting generic utility functions (like RTO scoring) into isolated, testable libraries.
    *   Propose automated validation (e.g., Zod schemas shared between frontend, `FormLoader` and n8n webhooks).

## Constraints & Style Guidelines
*   **Deep Dive Analysis**: Do not stay high-level. Quote specific files (e.g., `FormLoader.tsx`, `syncService.ts`), lines of code, database rules (`firestore.rules`), and n8n parameter nodes as concrete evidence.
*   **Visual Artifacts**: Rely on robust, well-structured Mermaid.js diagrams for all complex `Data Flow` and `State Machine` representations.
*   **Critical & Direct Tone**: Be merciless on the code quality. If an abstraction is "fake" (e.g., a massive `switch`/`case` block posing as a dynamic renderer for form components), call it out explicitly and demand a refactor.
