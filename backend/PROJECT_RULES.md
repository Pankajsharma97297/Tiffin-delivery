# TiffinBackend Development Handbook

This document is the working rulebook for Milestone 2: Core Development. Every developer and AI coding agent must read this file before changing the backend. The goal is to keep the foundation stable for the customer app, admin panel, partner app, payments, subscriptions, and long-term maintenance.

## Milestone 2 Scope

Milestone 2 covers the production-ready foundation for:

- Backend API using Node.js, Express, and Mongoose.
- MongoDB Atlas as the primary database.
- Authentication and authorization for customers, vendors, riders, admins, and super admin.
- Customer app APIs for registration/login, profile, home data, meals, plans, orders, subscriptions, wallet, calendar, skip meal, tracking, reviews, support, and notifications.
- Database models and service boundaries that can later support the partner app and admin panel without rewriting the core.
- Clean repository structure, environment setup, validation, security, logging, and deployment rules.

The proposal defines three applications that share this backend:

- Customer Mobile App: browse meals, trial meal, buy subscription, manage wallet, skip meals, track deliveries, calendar, reviews.
- Partner App: vendor and delivery rider role-based features.
- Admin Panel: customers, vendors, riders, orders, payments, reports, commission, approvals, plans.

## Current Backend Snapshot

The current project is a CommonJS Express API with MongoDB/Mongoose.

Existing high-level structure:

```text
TiffinBackend/
  app.js
  package.json
  package-lock.json
  .env.example
  src/
    app.js
    server.js
    config/
      database.js
    controllers/
    middleware/
    models/
    routes/
    seed/
    utils/
```

Existing API areas:

- `/api/auth`: register, login, Google login.
- `/api/users`: backward-compatible auth routes, authenticated profile read/update.
- `/api/home`: customer home data and admin dashboard data.
- `/api/orders`: order list, create order, order details, status update.
- `/api/data`: generic table reads for internal/admin use.
- `/api/super-admin`: super admin auth and protected table/product management.

Existing models include `User`, `Customer`, `SuperAdmin`, `Product`, `Category`, `Plan`, `Order`, `Subscription`, `WalletTransaction`, `ScheduleItem`, `HomeChef`, `Meal`, `Review`, `Notification`, and `SupportTicket`.

## Architecture Rules

Use layered backend architecture:

```text
Request
  -> Route
  -> Middleware
  -> Controller
  -> Service
  -> Model
  -> MongoDB Atlas
```

Current controllers may directly call models for small/simple operations. For new business-heavy features, create a service layer under `src/services/` so controllers stay thin.

Required responsibilities:

- Routes define URL structure and attach middleware only.
- Middleware handles auth, role checks, permission checks, request context, and errors.
- Controllers parse request data, call services/models, and return standard responses.
- Services contain business rules such as subscription activation, daily order generation, skip meal rules, wallet refunds, payment verification, and delivery assignment.
- Models define database shape, indexes, enums, defaults, validation, and relationships.
- Utils contain reusable pure helpers only.

Do not put business logic inside routes.

## Folder Structure Rules

Use this structure going forward:

```text
src/
  app.js
  server.js
  config/
    database.js
    env.js
  constants/
    roles.js
    statuses.js
  controllers/
  middleware/
  models/
  routes/
  services/
  validators/
  utils/
  seed/
  jobs/
```

Rules:

- One model per file.
- One route file per domain.
- One controller file per domain.
- Use `src/constants/` for repeated enums/status lists.
- Use `src/validators/` for request validation schemas when validation grows beyond simple checks.
- Use `src/jobs/` for scheduled jobs such as daily subscription order generation.

## Coding Standards

- Keep CommonJS unless the whole project is intentionally migrated to ESM.
- Use `asyncHandler` for all async controllers.
- Use clear names: `createSubscription`, `skipSubscriptionMeal`, `verifyPayment`, `assignDelivery`.
- Use early returns for validation failures.
- Do not return passwords, secrets, tokens from third parties, or internal stack traces.
- Prefer numbers for money amounts in paise, not formatted strings like `INR 89`.
- Prefer `Date` fields for dates and times, not strings like `24 Jan`.
- Use Mongoose `enum`, `required`, `trim`, `lowercase`, `min`, `max`, and indexes.
- Add indexes for common queries: `email`, `phone`, `role`, `status`, `customerId`, `vendorId`, `riderId`, `subscriptionId`, `deliveryDate`, `paymentId`.
- Do not add duplicate logic in controllers; move repeated logic to services/utils.

## Authentication And Authorization Flow

### Customer App

Preferred production flow:

1. Customer enters mobile number.
2. Backend sends OTP through an SMS provider.
3. Customer verifies OTP.
4. Backend creates or updates `User` with role `customer`.
5. Backend creates or updates linked `Customer`.
6. Backend returns JWT access token and customer profile.

Current fallback flow supports email/password and Google login. Keep it working until mobile OTP is complete.

### Admin, Vendor, Rider

- Admin, vendor, and rider use role-based login through `User`.
- `SuperAdmin` remains separate for highest-privilege table and permission management.
- Vendor accounts must support approval status before activation.
- Rider accounts must support active/inactive availability later.

### JWT Rules

- JWT payload should contain only minimal data: `id`, `role`, and optionally `permissions`.
- Tokens must be signed using `JWT_SECRET`.
- Use `JWT_EXPIRES_IN` from environment.
- Protected APIs must require `Authorization: Bearer <token>`.
- Role-specific routes must enforce both authentication and role authorization.

### Role Rules

Use these roles:

- `customer`
- `vendor`
- `rider`
- `admin`
- `super_admin`

Rules:

- Customer APIs can only access the logged-in customer's data.
- Vendor APIs can only access assigned vendor/menu/order data.
- Rider APIs can only access assigned delivery data.
- Admin APIs can manage operational data but not system secrets.
- Super admin APIs can manage permissions and high-risk table operations.

## API Rules

Base URL:

```text
/api
```

Response success format:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

Current helper spreads data into the top-level response. For new APIs, prefer a `data` object for consistency. If changing existing responses, keep backward compatibility for the mobile app.

Error format:

```json
{
  "success": false,
  "message": "Human readable error",
  "errors": []
}
```

HTTP status rules:

- `200`: successful read/update.
- `201`: successful create.
- `400`: validation error.
- `401`: missing/invalid authentication.
- `403`: authenticated but not allowed.
- `404`: resource not found.
- `409`: duplicate/conflict.
- `422`: valid JSON but business rule rejected.
- `500`: unhandled server error.

API design rules:

- Use nouns for resources: `/orders`, `/subscriptions`, `/wallet/transactions`.
- Use nested routes only when ownership matters.
- Use query params for filters: `?status=active&date=2026-07-06`.
- Use pagination for list APIs: `page`, `limit`, `sort`.
- Never expose generic admin table routes publicly.
- Do not accept client-provided ownership IDs when the same value can come from the JWT.

## Required Customer App API Domains

Milestone 2 should include or prepare these domains:

- Auth: OTP login, email/password fallback, Google login, logout/token expiry behavior.
- Profile: view/update name, phone, email, addresses.
- Home: assigned chef, today's meal, next meal, tomorrow meal, categories, nearby chefs.
- Plans: list 7-day, 15-day, 30-day, trial, and future admin-created plans.
- Products/Meals: browse meals, categories, meal details.
- Orders: create paid order, list my orders, get order details, status tracking.
- Subscriptions: purchase, activate after payment, list active/past, renewal date.
- Subscription Calendar: delivery dates, daily meal schedule, skipped days.
- Skip Meal: skip meal for allowed dates and notify vendor/rider.
- Wallet: balance, top-up, refunds, promotional credits, transaction history.
- Payments: create payment order, verify Razorpay/Cashfree payment, webhook handling.
- Reviews: meal/vendor/delivery feedback.
- Notifications: push notification registration and user notifications.
- Support: ticket creation, help center, WhatsApp support metadata.

## Database Choice And Setup

Use MongoDB Atlas Free Tier or production Atlas cluster. Do not depend on a locally installed MongoDB for deployment.

`.env.example` must show an Atlas URI pattern:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/tiffindb?retryWrites=true&w=majority
MONGO_DB_NAME=tiffindb
```

Atlas rules:

- Create separate databases for development, staging, and production.
- Enable IP access only for trusted environments.
- Use strong generated database passwords.
- Do not commit real Atlas credentials.
- Use connection pooling defaults unless load testing shows a real need.
- Enable Atlas backups before production launch.
- Use indexes before launch for all high-traffic queries.

## Database Structure Guidelines

Use ObjectId references for core relationships. Avoid storing only names when the record has identity.

Recommended model direction:

- `User`: login identity, role, auth provider, active state.
- `Customer`: customer profile, addresses, wallet balance snapshot, linked `userId`.
- `Vendor`: kitchen/vendor profile, approval status, service areas, capacity, linked `userId`.
- `Rider`: rider profile, availability, service areas, linked `userId`.
- `Product` or `MealItem`: meal catalog owned by vendor/admin.
- `Plan`: 7-day, 15-day, 30-day, trial, price, meal count, visibility.
- `Subscription`: customerId, planId, vendorId, startDate, endDate, status, renewal, paymentId.
- `SubscriptionDay`: subscriptionId, date, mealId, status, skip/reschedule metadata.
- `Order`: customerId, vendorId, riderId, items, amount, payment, status, delivery address.
- `Payment`: provider, providerOrderId, providerPaymentId, amount, status, raw webhook reference.
- `WalletTransaction`: customerId, amount, type, source, balanceAfter, referenceId.
- `Review`: customerId, orderId/subscriptionId, vendorId, riderId, rating, text.
- `SupportTicket`: customerId, status, priority, channel, issue.
- `Notification`: userId/audience, title, body, status, sentAt.

Money rules:

- Store money in paise as integers.
- Format rupees only in frontend or response presenters.
- Wallet balance must be updated with transaction history, not silent direct edits.

Date rules:

- Store dates in UTC.
- For India-specific delivery logic, convert business dates using `Asia/Kolkata`.
- Skip meal cutoff rules must use server time, not device time.

## Validation Rules

Validate at both request and schema level.

Required request validation:

- Required fields must be checked before DB writes.
- Email must be valid and lowercased.
- Phone must be normalized and validated for India numbers when OTP is implemented.
- Role must be one of the allowed roles.
- Payment method must be online only: `UPI`, `Credit Card`, `Debit Card`, `Net Banking`.
- COD is not allowed.
- Order status must follow the defined lifecycle.
- Subscription dates must not overlap incorrectly for the same active customer/plan.
- Skip meal must reject past dates and dates outside the active subscription.
- Wallet debits must not allow negative balance unless an explicit credit policy exists.

Use a validation library such as `zod`, `joi`, or `express-validator` before adding many more manual checks.

## Status Lifecycles

Order tracking:

```text
Order Confirmed -> Preparing -> Ready -> Out For Delivery -> Delivered
```

Vendor order flow:

```text
New Order -> Accepted -> Preparing -> Ready For Pickup -> Completed
```

Rider delivery flow:

```text
Assigned -> Picked Up -> Delivered
```

Payment flow:

```text
created -> pending -> paid -> failed -> refunded
```

Subscription flow:

```text
pending_payment -> active -> paused -> completed -> cancelled -> expired
```

Skip meal flow:

```text
available -> skipped -> rescheduled -> consumed
```

Do not invent new status strings inside controllers. Add shared constants first.

## Error Handling

- All async controllers must use `asyncHandler`.
- Mongoose validation errors should return `400`.
- Duplicate key errors should return `409`.
- JWT errors should return `401`.
- Permission failures should return `403`.
- Unknown routes should return `404`.
- Production responses must not include stack traces.
- Log server errors with request ID, route, method, user ID if available, and sanitized error details.

## Logging Rules

Add structured logging before production.

Recommended:

- Use `pino` or `winston`.
- Add request logging middleware.
- Generate or accept `x-request-id`.
- Log auth failures, payment webhook failures, subscription generation jobs, skip meal actions, wallet mutations, and admin destructive actions.

Do not log:

- Passwords.
- OTP values.
- JWT tokens.
- Payment secrets.
- Full card/bank data.
- MongoDB connection string.

## Security Best Practices

Required before production:

- Use `helmet`.
- Configure CORS with explicit allowed origins/apps.
- Add rate limits on auth, OTP, payment, and public APIs.
- Add request body size limits.
- Sanitize MongoDB query input where dynamic filters are allowed.
- Hash passwords with bcrypt.
- Store OTP hashed or short-lived in a provider/session store, not plain permanent values.
- Verify payment webhooks with provider signatures.
- Keep secrets in environment variables only.
- Use HTTPS in production.
- Rotate secrets if they were ever shared in chat, screenshots, or committed files.
- Restrict generic table-management APIs to super admin only.

## Environment Variables

Required:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/tiffindb?retryWrites=true&w=majority
MONGO_DB_NAME=tiffindb
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
```

Google login:

```env
GOOGLE_WEB_CLIENT_ID=
GOOGLE_IOS_CLIENT_ID=
GOOGLE_ANDROID_CLIENT_ID=
```

Payments:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_WEBHOOK_SECRET=
```

OTP/SMS:

```env
OTP_PROVIDER=
OTP_API_KEY=
OTP_SENDER_ID=
OTP_TTL_MINUTES=5
```

Notifications:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Never commit `.env`.

## Git And Repository Rules

- Keep source code in a Git repository from the start.
- Commit small, meaningful changes.
- Use branch names such as `feature/customer-auth`, `feature/subscriptions`, `fix/order-status-validation`.
- Commit message format:

```text
type(scope): short summary
```

Examples:

```text
docs(project): add backend development handbook
feat(auth): add customer otp verification
fix(orders): reject invalid status transitions
```

Do not commit:

- `.env`
- `node_modules/`
- Build outputs.
- Logs.
- Local OS/editor files.
- Real credentials or private keys.

## Deployment Steps

Minimum deployment flow:

1. Create MongoDB Atlas cluster and database.
2. Create database user with strong password.
3. Restrict Atlas network access to deployment IPs where possible.
4. Configure production environment variables.
5. Install dependencies with `npm ci`.
6. Run seed scripts only when explicitly required.
7. Start with `npm start`.
8. Verify `/` and `/api` health routes.
9. Verify auth, protected route, MongoDB read/write, payment webhook, and CORS.
10. Enable logs, monitoring, uptime alerts, and Atlas backups.

Recommended hosting:

- AWS, DigitalOcean, Render, Railway, or similar Node-compatible hosting.
- Use a process manager such as PM2 only on VPS-style deployments.
- Use CI/CD for repeatable deployments.

## Milestone 2 Implementation Checklist

Repository foundation:

- Add this handbook.
- Add meaningful `.gitignore`.
- Add complete `.env.example` using MongoDB Atlas.
- Add health check endpoint.
- Add API versioning plan if required: `/api/v1`.

Backend foundation:

- Centralize env validation.
- Add security middleware.
- Add logger and request ID.
- Normalize API response shape.
- Improve global error handler.
- Add validation middleware.

Authentication:

- Keep email/password and Google login working.
- Add mobile OTP flow for customer login.
- Add role guard middleware.
- Add customer-only, vendor-only, rider-only, admin-only route protection.

Customer app:

- Complete profile/address APIs.
- Complete plan listing.
- Complete product/meal listing and details.
- Complete paid order flow.
- Complete subscription purchase/activation.
- Complete calendar and skip meal APIs.
- Complete wallet balance and transaction APIs.
- Complete order tracking APIs.
- Complete reviews, notifications, and support ticket APIs.

Database:

- Move relationship fields from plain strings to ObjectId references.
- Store money as integer paise.
- Add indexes.
- Add data status constants.
- Add migration/seed safety rules.

Payments:

- Add Razorpay or Cashfree payment order creation.
- Add payment verification.
- Add webhook endpoint with signature verification.
- Activate subscription only after successful payment.

Quality:

- Add tests for auth, order creation, subscription activation, skip meal, wallet transaction, and payment verification.
- Add lint/format scripts.
- Add basic API documentation.

## Do's And Don'ts

Do:

- Read this handbook before coding.
- Keep MongoDB Atlas as the default database.
- Keep controllers thin.
- Add validation before writes.
- Protect all user-specific data with JWT and ownership checks.
- Store money in paise.
- Use server-side payment verification.
- Write small commits.
- Discuss unclear database/architecture decisions with Harshit before locking schema.

Don't:

- Do not use COD.
- Do not store money as formatted strings.
- Do not trust client-provided payment success.
- Do not expose admin table APIs publicly.
- Do not hardcode secrets.
- Do not commit `.env`.
- Do not create one-off status strings.
- Do not silently change response shapes used by the mobile app.
- Do not build major features directly inside routes.
- Do not delete or rewrite existing data structures without a migration plan.

## Open Architecture Decisions

Discuss with Harshit before final implementation:

- Exact vendor approval workflow and required vendor profile fields.
- Whether one subscription can include multiple meal slots per day.
- Skip meal cutoff timing and refund/reschedule policy.
- Wallet promotional credit expiry policy.
- Rider assignment strategy and batch delivery sequencing.
- Commission and settlement model for vendors/riders.
- Whether admin and super admin should remain separate collections long term.

## Immediate Next Development Order

1. Finalize env, security, logging, error handling, and validation foundation.
2. Add role guard middleware and protect sensitive routes.
3. Add customer profile/address APIs.
4. Add plans/products/meals APIs for the customer app.
5. Add payment creation and verification.
6. Add subscription activation and calendar generation.
7. Add skip meal rules.
8. Add wallet transaction flow.
9. Add order tracking and review/support APIs.
10. Add tests and API documentation.
