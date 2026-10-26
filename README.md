# LinkScope — URL Shortener with Analytics

A responsive full-stack URL shortener built with React, Vite, Express, MongoDB, JWT, and Recharts. Includes custom aliases, expiry, link management, click analytics, rate limiting, demo data, and backend tests.

## Features

- Register/login with bcrypt password hashing and JWT authentication.
- Create short links with generated aliases or custom aliases and optional expiry.
- Redirect active short links; expired and disabled links show clear status pages.
- Capture click timestamp, referrer, device type, and browser from user-agent data.
- Analytics per link: total clicks, clicks over time, top referrers, device and browser split.
- Edit destination, disable/enable, delete links, search link library, copy short URLs.
- Server-side HTTP/HTTPS validation, alias validation, duplicate detection, and rate-limited link creation.
- Responsive interface, demo seed script, `.env.example`, and automated unit tests.

## Requirements

Node.js 20+ and MongoDB (local or Atlas).

## Setup

1. Create a MongoDB database and copy `server/.env.example` to `server/.env`.
2. Set `MONGODB_URI`, a long random `JWT_SECRET`, and `BASE_URL`. For local development use `BASE_URL=http://localhost:5000` and `CLIENT_URL=http://localhost:5173`.
3. In one terminal:

   ```bash
   cd server
   npm install
   npm run seed
   npm run dev
   ```

4. In a second terminal, from the project root:

   ```bash
   cd client
   npm install
   npm run dev
   ```

5. Open http://localhost:5173.

## Demo login

Run `npm run seed` from the `server` folder. Defaults:

- Email: `demo@example.com`
- Password: `DemoPass123!`

Override using `DEMO_EMAIL` and `DEMO_PASSWORD` in `server/.env`. Change the demo password before deploying publicly. The seed script creates a `welcome-demo` link and sample analytics events.

## Tests

```bash
cd server
npm test
```

The automated tests cover URL scheme validation, malformed and empty URLs, alias generation, analytics aggregation, and expiry decisions.

## Environment variables

### `server/.env`

- `PORT`: API port (default 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: secret for signing JWTs; use a long random value
- `BASE_URL`: public backend URL used to build short links
- `CLIENT_URL`: frontend origin for CORS
- `DEMO_EMAIL`: seed account email
- `DEMO_PASSWORD`: seed account password

### `client/.env`

- `VITE_API_URL`: API base URL

Never commit `.env` files or secrets.

## Data model and design decisions

- `User`: name, normalized unique email, bcrypt password hash, timestamps.
- `Link`: owner reference, destination URL, unique alias, optional expiry, disabled flag, timestamps, and embedded click events.
- Each click event stores `clickedAt`, `referrer`, `device`, and `browser`.
- Link queries and updates are scoped to the authenticated owner.
- Redirect handler responds before analytics persistence is awaited; analytics writes are scheduled asynchronously. This is best-effort analytics, not a durable event queue.
- Click events are embedded for a simple assignment-sized data model. A production system with very high click volume should use a separate Click collection and a durable queue/event pipeline.

## Known limitations / next steps

- Analytics writes are best-effort and may be lost if the process stops immediately after redirect.
- Unique visitors are not implemented; only total clicks are counted.
- QR code generation is not implemented.
- No email verification, password reset, or refresh-token rotation.
- Before production use, add persistent queued analytics, stronger security headers, centralized logging, and load testing.

## AI tools disclosure

ChatGPT was used to assist with project scaffolding, implementation drafts, test cases, and documentation. The developer should review, run, test, and be prepared to explain every submitted part.

## Deployment notes

Deploy the `server` directory as a Node service and `client` as a static Vite site. Configure all environment variables on the hosting provider, set `BASE_URL` to the public API domain and `VITE_API_URL` to that same API URL at frontend build time. Allow the frontend origin in `CLIENT_URL`. A live demo is not included by default.
