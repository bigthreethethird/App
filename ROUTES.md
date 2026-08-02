# Cannect Route Manifest

## Public Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/pricing` | Pricing tiers |
| `/tap/[nfcId]` | Consumer product passport |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |

## Protected Pages (requires Clerk auth)
| Route | Description |
|-------|-------------|
| `/dashboard` | Brand overview |
| `/dashboard/products` | Product list |
| `/dashboard/products/new` | Create product |
| `/dashboard/products/[id]` | Edit product |
| `/dashboard/analytics` | Analytics dashboard |
| `/dashboard/settings` | Brand settings |
| `/dashboard/settings/billing` | Billing management |

## API Endpoints
### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/waitlist` | Join waitlist |
| GET | `/api/tap/:nfcId` | Product lookup |
| POST | `/api/tap/:nfcId/scan` | Record scan |
| POST | `/api/chat` | AI budtender chat |

### Protected (Clerk auth)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/admin/products` | List / create products |
| GET/PATCH/DELETE | `/api/admin/products/:id` | Read / update / delete |
| GET | `/api/admin/analytics` | Analytics overview |
| GET | `/api/admin/analytics/scans` | Recent scans |
| GET | `/api/admin/analytics/top-products` | Top products |
| GET/PATCH | `/api/admin/brand` | Brand profile |
| POST | `/api/admin/billing/create-checkout` | Stripe checkout |
| GET | `/api/admin/billing/portal` | Customer portal |
| GET | `/api/admin/billing/subscription` | Subscription status |
| POST | `/api/admin/upload` | File upload |
| DELETE | `/api/admin/upload` | Delete file |

### Webhooks
| Method | Path | Service |
|--------|------|---------|
| POST | `/api/webhooks/clerk` | Clerk |
| POST | `/api/webhooks/stripe` | Stripe |
