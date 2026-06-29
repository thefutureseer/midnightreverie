# 🎭  Virtual, Live, Stage Show, Pass app [code name midnight reverie- ] # 🎭 - Gated Decentralized Theater Platform — Gated B2B2C Theater Licensing Platform

Midnight Reverie is a full-stack MERN (MongoDB, Express, React, Node.js) platform designed to digitize, scale, and protect physical stage productions. Instead of just selling streaming tickets directly to consumers, it introduces a **B2B2C Independent Venue Licensing model**—allowing users to purchase exhibition rights, host micro-venues (watch parties), and dynamically monetize a live broadcast signal while completely protecting the physical box office.

---

## ⚡ Key Architectural Features

### 1. Independent Venue Licensing (B2B2C)
* **The License:** Logged-in users pay a flat **$15.00 upfront performance fee** to become an approved Host.
* **The Micro-Venue:** Approved hosts spin up localized event listings with venue descriptions, seat capacity limits, and images of their physical viewing setups (e.g., backyard projector, lounge).
* **The Revenue Split:** Hosts set their own guest ticket prices and keep their profits. The platform tracks all secondary guest sales via an automated royalty tracking formula:
  $$\text{Platform Revenue} = \$15 + \left(0.03 \times \text{Total Guest Ticket Sales}\right)$$

### 2. Guarding the Box Office: Automated Sell-Out Trigger
To preserve the economic integrity of physical brick-and-mortar theaters, the platform uses a **Dynamic Availability Engine** to prevent digital streaming from cannibalizing local physical ticket sales:
* **Exclusive Physical Window:** When an event is listed, virtual ticket options are locked or restricted to a **"Virtual Waitlist"** via the `virtualSalesStatus` state layer.
* **The Sell-Out Trigger:** The backend continuously monitors capacity. The exact moment physical ticket inventory hits 100% capacity ($\text{physicalSeatsSold} \ge \text{totalPhysicalSeats}$), a controller automatically flips the event status to `Open`, unlocking virtual ticket checkouts and broadcasting alerts to the waitlist.

### 3. Tiered-Discount Watch Parties (Viral Growth Loops)
* **Dynamic Pricing Math:** Guest ticket prices automatically decrease within a host's venue page as total group ticket volume increases.
* **Low-Friction Checkout:** Guests do not need to create accounts. They simply input their Name and Email to checkout via a simulated Stripe webhook environment.
* **Gamified Progress Bar:** The guest-facing venue page displays a visual tracker incentivizing current viewers to invite friends to unlock lower price tiers.

### 4. Synchronized Physical Live-Stream (Gated Access)
* **Showtime Hard Wall:** Tailored to model a real-world physical stage production broadcast. Features a counting-down "Theater Lobby" UI prior to curtain call.
* **No-Login Ticket Gate:** Guests instantly unlock the live stream media player by verifying the email address they used at checkout. The backend securely validates the session against the `WatchPartyTicket` schema.

---

## 🛠️ Tech Stack & Production Architecture

* **Frontend:** React with Tailwind CSS (Cinema Dark Theme).
* **Backend:** Node.js + Express.js RESTful APIs.
* **Database Layer:** Robust data persistence powered by **MongoDB and Mongoose OGM** handling relational mapping between Users, Venues, Events, and Waitlists.
* **Auth:** JSON Web Tokens (JWT) for secure host dashboards and gated stream authorization.

---

## 🧪 Comprehensive QA Testing Suite

Midnight Reverie implements a professional multi-tiered testing pipeline to ensure absolute data and UI state integrity.

### 1. Integration & API Testing (Jest + Supertest)
Ensures our backend controllers, model validations, and security gates operate perfectly in isolation.
* Tests mock authentication, payload schema constraints, and waitlist handling.
* Validates the automated sell-out state transition logic on the database level.
* **Run Backend Tests:** `npm run test` or `npx jest`

### 2. End-to-End (E2E) Browser Automation (Playwright)
Simulates real user actions across headless Chromium, Firefox, and WebKit to confirm the frontend UI responds dynamically to server state changes.
* Verifies that the "Buy Virtual Ticket" button is safely locked/disabled while physical seats remain.
* Simulates physical ticket purchases to force a sell-out scenario and asserts that the UI dynamically enables the Virtual Ticket button in real time.
* **Run E2E UI Tests:** `npx playwright test`
* **Launch Playwright Interactive Visual UI Runner:** `npx playwright test --ui`

---

## 🚀 Instant Demo Testing Workflow

The application boots out-of-the-box pre-seeded with environment data. You can instantly simulate both the Host and Guest experiences using the credentials displayed in the app's **Demo Mode Tip Box**:

1. **Test the Host Dashboard:** Log in as an active host to manage your seating capacity, view your custom venue page, and track your ticket revenue payouts.
2. **Test Guest Checkout & Waitlists:** Copy your unique `/venue/:id` link, add a mock user to the virtual waitlist, buy up the remaining physical seats, and watch the platform unlock the virtual floodgates.
3. **Verify Gated Stream Access:** Enter your purchase email on the theater page to securely pass the JWT gatekeeper and launch the live stream player simulation.
