# EliteAdx

A role-based advertising platform connecting **advertisers** (who run campaigns), **publishers** (who host ad units on their sites), and **admins** (who moderate and oversee the platform). Built with Node.js, Express, MongoDB, and Flutterwave for payments.

## Roles

| Role | Can do |
|---|---|
| **Admin** | Approve/reject campaigns, moderate flagged ads, approve withdrawals, view platform-wide analytics |
| **Advertiser** | Create campaigns with a budget and destination URL, fund their wallet, track spend/CTR |
| **Publisher** | Register sites, receive ad assignments, track earnings, request payouts |

Each role gets its own dashboard (`/dashboard/admin`, `/dashboard/advertiser`, `/dashboard/publisher`), served after login based on the `role` returned from `/api/auth/login`.

## Tech stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT (bearer token, stored client-side)
- **Payments:** Flutterwave (deposits, withdrawals, webhooks)
- **Frontend:** Static HTML/CSS/JS dashboards (no framework), Chart.js for charts
- **Security:** Helmet, CORS, express-mongo-sanitize, rate limiting

## Project structure

```
project-root/
├── server.js                 # entry point
├── public/                   # static frontend
│   ├── login.html / login.js
│   └── dashboard/
│       ├── admin.html / advertiser.html / publisher.html
│       ├── css/dashboard.css
│       └── js/admin.js / advertiser.js / publisher.js
├── src/
│   ├── app.js                # Express app setup
│   ├── config/                # db.js, env.js
│   ├── controllers/           # route handlers
│   ├── middleware/            # auth, roleCheck, rateLimiter, errorHandler
│   ├── models/                 # User, Campaign, Ad, Publisher, Payment, Notification, DailyStat
│   ├── routes/
│   ├── services/               # flutterwave, notifier, ctrEngine
│   └── utils/logger.js
└── tests/
```

## Getting started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.example` to `.env` and fill in real values:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `FLW_SECRET_KEY` | Flutterwave secret API key |
| `FLW_WEBHOOK_HASH` | Shared secret to verify Flutterwave webhook signatures |
| `CLIENT_URL` | Base URL used for CORS and payment redirect callbacks |
| `PORT` | Port the server listens on (optional, defaults may apply) |

**Never commit `.env`.** Confirm it's listed in `.gitignore` before your first commit.

### 3. Run the server
```bash
node server.js
```
Or, if you have a dev script with auto-reload configured:
```bash
npm run dev
```

### 4. Create your first admin
There is no public admin signup. Seed your first admin account directly in MongoDB, or via a one-off script, with `role: 'admin'`. All other accounts (advertiser/publisher) are created through the platform after that.

## Core flow

1. **Advertiser** creates a campaign with a budget, vertical, and `destinationUrl` (their real referral link) → status starts as `in_review`.
2. **Admin** reviews it in the Moderation queue → approves → status becomes `active`.
3. **Publisher** registers their site → admin (or an assignment flow) creates an `Ad` linking that site to an active campaign.
4. **Publisher** embeds the ad's tracking pixel/link on their site:
   ```html
   <img src="https://yourdomain.com/api/ads/AD_ID/impression" width="1" height="1">
   <a href="https://yourdomain.com/api/ads/AD_ID/click">Ad text</a>
   ```
5. Clicks/impressions are tracked server-side, then the visitor is redirected to the advertiser's real `destinationUrl`.
6. Earnings split (currently 15% platform fee, configurable in `services/ctrEngine.js`) accrues to the publisher; both sides can request withdrawals via Flutterwave.

## API overview

| Route | Notes |
|---|---|
| `POST /api/auth/login` | Returns `{ token, user }`, `user.role` drives dashboard redirect |
| `GET /api/analytics/overview` | Role-aware — returns different data shape for admin/advertiser/publisher |
| `POST /api/campaigns` | Advertiser creates a campaign |
| `PATCH /api/moderation/campaigns/:id` | Admin approve/reject |
| `POST /api/publishers` | Publisher registers a site |
| `POST /api/ads` | Admin assigns a campaign to a publisher (creates an ad unit) |
| `GET /api/ads/:id/click` | Public — logs a click, redirects to the campaign's destination URL |
| `GET /api/ads/:id/impression` | Public — logs an impression, returns a 1×1 tracking pixel |
| `POST /api/payments/deposit` | Advertiser/publisher funds their wallet via Flutterwave |
| `POST /api/payments/withdraw` | Requests a payout (admin approval required) |
| `POST /api/payments/webhook` | Flutterwave server-to-server confirmation |

## Known gaps / in progress

- **Time-series charts** depend on `DailyStat`, which is populated by the click/impression tracking routes — historical data will only exist going forward from when tracking went live, not retroactively.
- **Notifications** are written to MongoDB (`services/notifier.js`) but not yet exposed via a `GET` endpoint — dashboard bell/notification UI is not yet wired to real data.
- **Auth token storage** currently uses `localStorage`. This is vulnerable to XSS-based token theft; migrating to an `httpOnly` cookie (with CSRF protection) is a planned hardening step.
- **Custodial wallet model**: the platform currently holds advertiser/publisher balances directly. Confirm compliance requirements (e.g. CBN licensing considerations in Nigeria) before scaling real transaction volume — consult a lawyer/compliance advisor, this is not something to assume is fine by default.

## License

Add your license here.
