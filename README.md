# Proofloop

> **A clear record of what was agreed, what was paid, and what happened after checkout.**

Proofloop is a full-stack e-commerce trust and order-tracking platform for buyers and small sellers. Before checkout, guarded AI generates an immutable **Promise Card** synthesized from the seller's verified delivery options and return policy. After checkout through PayPal Sandbox, Proofloop's signature **Promise Drift Detector** continuously monitors warehouse and carrier updates to detect conflicts before they escalate into disputes.

---

## Key Features

1. **AI-Assisted Promise Card (`/checkout`)**
   - Buyer describes what they need (e.g., *"I need it delivered before Friday for an executive presentation"*).
   - Guarded AI evaluates the requirement against the seller's actual delivery speed and return policy.
   - Highlights warnings if selected shipping cannot meet the buyer's requirement.
   - Generates an immutable cryptographic integrity hash (`plp_...`) locked upon buyer confirmation.

2. **Official PayPal Sandbox Standard Checkout (`/checkout`)**
   - Integrated with `@paypal/react-paypal-js` and PayPal Orders v2 API.
   - Server-side order creation and server-verified capture before payment completion.
   - Idempotency protection against duplicate captures.
   - Clearly separated **Demo Sandbox Simulation** flow for zero-friction evaluation when credentials are not configured.

3. **Signature Promise Drift Detector (`/orders/[id]`)**
   - Compares real or simulated fulfillment updates side-by-side with the agreed Promise Card.
   - Detects concrete mismatches:
     - Delivery ETA rescheduled past buyer required deadline.
     - Carrier service downgraded (e.g., promised Air, dispatched Ground).
     - Premature delivery marked without carrier dispatch.
   - AI drafts objective, professional customer service messages citing the seller's published store policy.

4. **Strict Truth & AI Guardrails**
   - AI **never** decides disputes, claims legal authority, automatically issues refunds, or marks payments as succeeded.
   - Payments only succeed upon server-verified PayPal capture.
   - Strict factual summarization: AI cannot invent stock, delivery dates, or warranty terms.

5. **Transaction Analytics with AG Grid (`/analytics`)**
   - AG Grid table with multi-column sorting, filtering, and pagination.
   - Natural-language query bar (e.g., *"Show delayed orders with captured payments"*).

6. **Interactive Milestone Timeline (`/timeline`)**
   - Visual milestone timeline component mapping order progression: Promise Agreement → Capture → Fulfillment → Drift Detection.

7. **Searchable Audit Trail (`/audit`)**
   - Every system event tags its verified origin: `[PAYPAL_SANDBOX]`, `[APP_ACTION]`, `[AI_GUARDED_AGENT]`, `[DEMO_SIMULATION]`, `[ZAPIER_WEBHOOK]`.
   - Clear distinction between factual system events and AI suggestions.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Payments**: PayPal Sandbox REST Orders v2 API & `@paypal/react-paypal-js`
- **Validation**: Zod schema validation on all API endpoints
- **Data Grid**: AG Grid Community (v32)
- **Containerization**: Docker Compose (`postgres:16-alpine`)
- **Deployment**: Render Blueprint (`render.yaml`)

---

## Technology & Sponsor Integrations

| Technology / Sponsor | Operational Status | Description | Fallback when Unconfigured |
| :--- | :--- | :--- | :--- |
| **PayPal Sandbox** | Configurable | Official Orders v2 API creation & capture | Clearly separated **Demo Sandbox Simulation** flow |
| **Guarded AI / Astropods** | Configurable | Server-side LLM for Promise Cards & drift analysis | Deterministic rule-based template engine |
| **Astropods Observability** | Configurable | Read-only fact boundaries & agent telemetry logging | In-memory local telemetry buffer |
| **Channel3** | Configurable | Natural-language product discovery API (`/api/channel3/search`) | Curated discovery catalog |
| **AG Grid / AG Studio** | Integrated | Sortable, filterable ledger with natural-language query engine | AG Grid Community with dynamic filtering |
| **Bryntum Timeline** | Integrated | Milestone timeline visualizing order lifecycles | Interactive visual timeline component |
| **Elasticsearch** | Configurable | Searchable order knowledge & policy retrieval (`/api/search`) | Authoritative database search fallback |
| **Zapier** | Configurable | Webhook dispatcher for captured payments & drift alerts | Safe no-op with delivery logging |
| **APIMatic / OpenAPI** | Integrated | OpenAPI 3.0 specification (`/openapi.json`) and docs (`/api-docs`) | Interactive web documentation |
| **Postman** | Integrated | Runnable test collection (`Proofloop.postman_collection.json`) | N/A |
| **KERNEL** | Integrated | Headless browser demo runner (`scripts/kernel-demo-runner.ts`) | Direct in-app demo controls |
| **Render** | Integrated | Infrastructure Blueprint (`render.yaml`) | Local Docker Compose |

---

## Prerequisites

- **Node.js**: v18.17+ (v20+ recommended)
- **npm** or compatible package manager
- *(Optional)* **Docker & Docker Compose** for local PostgreSQL

---

## Local Setup & Quick Start

### 1. Clone & Install Dependencies
```bash
cd pay2
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default contents of `.env`:
```env
APP_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/proofloop
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
CHANNEL3_API_KEY=
ELASTICSEARCH_URL=
ELASTICSEARCH_API_KEY=
ZAPIER_WEBHOOK_URL=
ASTROPODS_API_KEY=
```

> **Note on Zero-Configuration Demo Mode**: Proofloop runs **out of the box** even without setting any API keys! It includes a rich in-memory fallback store seeded with realistic demo products, sample orders (with and without drift), and deterministic template engines.

### 3. Database Setup (Optional Docker PostgreSQL)
To run local PostgreSQL:
```bash
# Start PostgreSQL container
docker compose up -d

# Push Prisma schema and seed demo records
npm run db:push
npm run db:seed
```
*If Docker is not running, Proofloop automatically uses its built-in high-fidelity data repository without throwing connection errors.*

### 4. Build and Run
```bash
# Build production bundle
npm run build

# Start production server
npm run start
```
Or for local development:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## End-to-End Walkthrough

1. **Landing Page (`/`)**:
   - Inspect the value prop, flow diagram, and live demo statistics.
   - Click **"Sponsor Tech"** in the top navbar to inspect live connection checks for PayPal, AI, Channel3, Elastic, etc.

2. **Natural-Language Discovery with Channel3 (`/checkout`)**:
   - Click **"Find with Channel3"**.
   - Search for *"noise cancelling headphones"* or *"waterproof commuter backpack"*.
   - Click **"Import to Checkout"** to turn external merchant offerings into a Proofloop demo order.

3. **PromiseCheck & Promise Card Generation (`/checkout`)**:
   - Select a product (e.g. *AeroPeak Headphones* or *Artisan Mechanical Keyboard*).
   - Enter your name, email, and stated need:
     `"Urgent: Must arrive by Friday Nov 14 for an executive gift"`.
   - Select a shipping speed (e.g. *Standard Ground*).
   - Click **"Generate Promise Card"**.
   - Notice the **Promise Conflict Warning** flagged because standard shipping cannot guarantee delivery by Friday!
   - Review the immutable card preview, check the confirmation box, and click **"Confirm Promise Card & Unlock Payment"**.

4. **PayPal Sandbox Checkout (`/checkout`)**:
   - If `PAYPAL_CLIENT_ID` is set: Click the official PayPal button to authenticate with PayPal Sandbox.
   - If testing without keys: Click **"Complete Simulated Sandbox Payment"**.
   - Server verifies the capture and redirects to the Order Detail page.

5. **Order Detail & Promise Drift Detector (`/orders/[id]`)**:
   - Compare the sealed **Promise Card** on the left with current order progress on the right.
   - Scroll to the **Demo Fulfillment Control Console**.
   - Select **"Report Delay"**, set revised ETA past the buyer's deadline, and click **"Submit Fulfillment Update & Check Drift"**.
   - Watch the **Promise Drift Alert** activate:
     - Side-by-side comparison of **Agreed Commitment** vs **Fulfillment Reality**.
     - AI-drafted message citing the seller's published return/guarantee policy.
     - Disclaimers reinforcing AI neutrality and human review.

6. **AG Grid Analytics (`/analytics`)**:
   - Explore orders in the AG Grid ledger.
   - In the natural-language query bar, type:
     `Show delayed orders with captured payments` or `Show orders with promise drift`.
   - Watch the grid dynamically filter matching records in real time.

7. **Bryntum Milestone Timeline (`/timeline`)**:
   - Switch between orders to inspect chronological milestones (Creation, Agreement, Capture, Fulfillment, Drift).

8. **Audit Trail (`/audit`)**:
   - Search audit events and filter by origin (`[PAYPAL_SANDBOX]`, `[AI_GUARDED_AGENT]`, `[APP_ACTION]`, `[DEMO_SIMULATION]`).

---

## Automated KERNEL Browser Demo

Proofloop includes an isolated script that exercises the full checkout and drift detection workflow:
```bash
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/kernel-demo-runner.ts http://localhost:3000
```

---

## Postman Collection Usage

1. Open Postman.
2. Click **Import** and select:
   - `Proofloop.postman_collection.json`
   - `Proofloop.postman_environment.json`
3. Execute requests 1 through 10 to test:
   - Product catalog retrieval
   - Channel3 search
   - Promise Card generation
   - Order creation & Promise confirmation
   - PayPal order creation & capture
   - Fulfillment updates & drift detection
   - Knowledge search

---

## Deploying to Render

Proofloop includes a ready-to-deploy `render.yaml` Blueprint file:
1. Push your repository to GitHub / GitLab.
2. In the Render Dashboard, click **New +** → **Blueprint**.
3. Select your repository. Render will automatically configure:
   - A Next.js Web Service (`proofloop-web`)
   - A Managed PostgreSQL Database (`proofloop-db`)
4. Add your optional API credentials (`PAYPAL_CLIENT_ID`, `AI_API_KEY`, `CHANNEL3_API_KEY`) under the Web Service Environment tab.
5. Deploy!
