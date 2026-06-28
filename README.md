# 🎭  Virtual Live Stage Show Pass app [code name midnight reverie- ] # 🎭 - Gated Decentralized Theater Platform

Midnight Reverie is a full-stack MERN (MongoDB, Express, React, Node.js) platform that digitizes and scales physical stage productions. Instead of just selling streaming tickets directly to consumers, it introduces a **B2B2C Independent Venue Licensing model**—allowing users to purchase exhibition rights, host micro-venues (watch parties), and dynamically monetize the live broadcast signal.

---

## ⚡ Key Architectural Features

### 1. Independent Venue Licensing (B2B2C)
* **The License:** Logged-in users can pay a flat **$15.00 upfront performance fee** to become an approved Host.
* **The Micro-Venue:** Approved hosts spin up localized event listings with venue descriptions, seat capacity limits, and images of their physical viewing setups (e.g., backyard projector, lounge).
* **The Revenue Split:** Hosts set their own guest ticket prices and keep their profits. The platform tracks all secondary guest sales via an automated royalty tracking formula:
  $$\text{Platform Revenue} = \$15 + \left(0.03 \times \text{Total Guest Ticket Sales}\right)$$

### 2. Tiered-Discount Watch Parties (Viral Growth Loops)
* **Dynamic Pricing Math:** Guest ticket prices automatically decrease within a host's venue page as total group ticket volume increases.
* **Low-Friction Checkout:** Guests do not need to create accounts. They simply input their Name and Email to checkout via a simulated Stripe webhook environment.
* **Gamified Progress Bar:** The guest-facing venue page displays a visual tracker incentivizing current viewers to invite friends to unlock lower price tiers.

### 3. Synchronized Physical Live-Stream (Gated Access)
* **Showtime Hard Wall:** Tailored to model a real-world physical stage production broadcast. Features a counting-down "Theater Lobby" UI prior to curtain call.
* **No-Login Ticket Gate:** Guests instantly unlock the live stream media player by verifying the email address they used at checkout. The backend securely validates the session against the `WatchPartyTicket` schema.

---

## 🛠️ Tech Stack & Mock Architecture
* **Frontend:** React with Tailwind CSS (Cinema Dark Theme).
* **Backend:** Node.js + Express.js APIs.
* **Database Layer:** Mocked in-memory filesystem server mimicking Mongoose mongoose schemas for 100% self-contained local testing inside Replit.
* **Auth:** JSON Web Tokens (JWT).

---

## 🚀 Instant Demo Testing Workflow

The application boots out-of-the-box pre-seeded with environment data. You can instantly simulate both the Host and Guest experiences using the credentials displayed in the app's **Demo Mode Tip Box**:

1. **Test the Host Dashboard:** Log in as an active host to manage your seating capacity, view your custom venue page, and track your ticket revenue payouts.
2. **Test Guest Checkout:** Copy your unique `/venue/:id` link, check out using a mock name/email, and watch the group progress bar dynamically drop the ticket price for the next buyer.
3. **Verify Gated Stream Access:** Enter your purchase email on the theater page to securely pass the JWT gatekeeper and launch the live stream player simulation.
