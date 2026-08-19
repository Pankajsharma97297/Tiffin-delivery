# MIDDO Backend

MIDDO Backend is the Node.js API service for the MIDDO tiffin delivery platform. It powers authentication, customer profiles, home dashboard data, orders, subscriptions, wallet transactions, upload handling, and super-admin management.

## Features

- Customer registration, login, Google login, location, profile, settings, and address APIs
- Home dashboard data for customer app and admin dashboards
- Order creation, lookup, status updates, wallet payment handling, and subscription records
- Wallet top-up and transaction history APIs
- Super-admin authentication, permissions, product/category/admin management, and managed-table CRUD
- Profile image upload endpoint with static upload serving
- Seed scripts for demo data and role credentials

## Tech Stack

- Node.js
- Express 5
- MongoDB and Mongoose
- JSON Web Tokens
- bcryptjs password hashing
- Google Auth Library
- dotenv
- validator
- nodemon for development

## Installation

```sh
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill production-safe values.

| Variable                  | Description                    |
| ------------------------- | ------------------------------ |
| `NODE_ENV`                | Runtime environment            |
| `PORT`                    | HTTP server port               |
| `MONGO_URI`               | MongoDB connection string      |
| `MONGO_DB_NAME`           | Database name                  |
| `JWT_SECRET`              | Long random JWT signing secret |
| `JWT_EXPIRES_IN`          | JWT lifetime, default `7d`     |
| `GOOGLE_WEB_CLIENT_ID`    | Google web OAuth client ID     |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full Firebase service account JSON for ID token verification |
| `FIREBASE_PROJECT_ID`     | Firebase project ID, when not using full JSON |
| `FIREBASE_CLIENT_EMAIL`   | Firebase service account email |
| `FIREBASE_PRIVATE_KEY`    | Firebase service account private key, with `\n` escaped |
| `RAZORPAY_KEY_ID`         | Razorpay key ID                |
| `RAZORPAY_KEY_SECRET`     | Razorpay secret                |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret        |
| `SEED_DEFAULT_PASSWORD`   | Shared seed password fallback  |
| `SEED_*_PASSWORD`         | Role-specific seed passwords   |

Seed scripts require either `SEED_DEFAULT_PASSWORD` or each role-specific password. Do not commit real `.env` files.

## Running Locally

```sh
npm run dev
```

The server starts from `app.js`, loads `src/server.js`, connects MongoDB, and mounts APIs under `/api`.

## Production Build

This service does not require a compile step. Validate syntax before deployment:

```sh
npm run check
```

Start production:

```sh
npm start
```

## Deployment

- Provision MongoDB and set `MONGO_URI`.
- Set `JWT_SECRET` to a long random value.
- Configure OAuth and payment provider credentials in the deployment environment.
- Persist `src/uploads/` or switch uploads to managed object storage before scaling horizontally.
- Run behind HTTPS and a reverse proxy or platform router.

## Folder Structure

```text
.
├── app.js
├── src/
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed/
│   ├── uploads/
│   └── utils/
└── package.json
```

## Available Scripts

| Script                     | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `npm start`                | Start production server                          |
| `npm run dev`              | Start development server with nodemon            |
| `npm run seed`             | Seed demo data                                   |
| `npm run sync:credentials` | Sync role credentials from environment variables |
| `npm run check`            | Syntax-check JavaScript files                    |

## Architecture Overview

- `src/app.js` configures Express middleware, health routes, static uploads, and API routing.
- `routes/` maps API resources to controllers.
- `controllers/` contain request orchestration and response shaping.
- `models/` define MongoDB collections and validation.
- `middleware/` contains auth, permission, and error handling.
- `utils/` contains shared helpers such as token generation, responses, logging, and schedule helpers.

## Troubleshooting

- `MONGO_URI is missing`: create `.env` from `.env.example`.
- `JWT_SECRET is missing`: set a strong JWT secret before auth flows.
- Firebase login fails: set either `FIREBASE_SERVICE_ACCOUNT_JSON` or the split `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` values.
- Google login fails: confirm `GOOGLE_WEB_CLIENT_ID` matches the mobile app client configuration.
- Seed fails on password variables: set `SEED_DEFAULT_PASSWORD` or every role-specific seed password.
- Uploaded images missing after deploy: configure persistent storage for `src/uploads/`.

## Contribution Guide

- Preserve API contracts and response shapes.
- Keep secrets in environment variables only.
- Run `npm run check` before pushing.
- Avoid committing generated uploads, logs, local `.env`, or `node_modules`.
- Add validation and error handling near controller boundaries.
