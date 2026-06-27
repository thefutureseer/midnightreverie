# 🎭  Virtual Stage Show app code name midnight reverie- Ticketed Streaming App (MERN Stack Demo)

A full-stack prototype built with the MERN stack (MongoDB, Express, React, Node.js) and Tailwind CSS that simulates an online theater lobby where users can buy tickets to a virtual stage show and watch a secure, gated video stream.

---

## 🚀 Instant Demo Mode (No Setup Required)

This application is **100% self-contained** and uses a mock local database and mock payment system. You do not need to configure external MongoDB Atlas URIs or real Stripe API keys to test it.

### Test Credentials
To see how the video gate behaves based on ticket status, log in with these pre-seeded test accounts:

1. **User WITH Ticket:**
   - **Email:** `viewer@test.com`
   - **Password:** `password123`
   - *Behavior:* Can instantly access the video theater page and watch the stream.

2. **User WITHOUT Ticket:**
   - **Email:** `windowshopper@test.com`
   - **Password:** `password123`
   - *Behavior:* Blocked from the theater page. Clicking "Buy Ticket" opens a mock checkout modal. Submitting the mock payment instantly grants stream access.

---

## 🛠️ Key Features

* **Gated Video Theater:** Backend route `GET /api/stream/verify` validates the user's JWT and database profile before releasing the stream URL.
* **Mock Stripe Integration:** Simulates a webhook event upon successful completion of the frontend dummy checkout form.
* **Dark-Themed Theater UI:** Built with React and Tailwind CSS to look like a modern cinematic lobby and video player interface.
* 
