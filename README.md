# RRMS — Resort Management System

A runnable, browser-only resort management frontend for **The Palm Resort**, built from the supplied Guest, Management, Staff, Owner, and cross-module flowcharts. The cross-module flow is implemented through shared records; it is not a fifth module.

## Start the application

Requires Node.js 20.19+ or 22.12+ and npm. Node.js 24 is supported.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5187**. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run dev
```

The app opens in the Management demo workspace. Use the four-module switcher to explore a different perspective, or sign out from the profile menu to enter credentials manually. The Staff workspace has a role selector for all seven staff roles.

```sh
npm run build        # Type-check and produce dist/
npm run preview      # Serve the production build
npm test             # Domain and cross-module business-rule tests
npm run test:e2e     # Browser workflow tests; uses installed Google Chrome
```

The browser tests start the development server if necessary. On a machine without Chrome, install Chromium with `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.ts`. On non-Windows systems, change its webServer command from `npm.cmd run dev` to `npm run dev`.

## Demo credentials

All initial accounts use **`Resort@123`**.

| Workspace / role             | Email                    |
| ---------------------------- | ------------------------ |
| Guest — Alex Morgan          | `guest@rrms.demo`        |
| Management — Ananya Kapoor   | `management@rrms.demo`   |
| Owner — Vikram Oberoi        | `owner@rrms.demo`        |
| Staff — Receptionist         | `receptionist@rrms.demo` |
| Staff — Housekeeping         | `housekeeping@rrms.demo` |
| Staff — Cashier              | `cashier@rrms.demo`      |
| Staff — Maintenance          | `maintenance@rrms.demo`  |
| Staff — Gardener / Caretaker | `gardener@rrms.demo`     |
| Staff — F&B                  | `fandb@rrms.demo`        |
| Staff — Spa                  | `spa@rrms.demo`          |

Each staff role also has a second account, with `2` before `@rrms.demo`, for example `spa2@rrms.demo`. These accounts have the later shift. Other seeded guests use their displayed profile email and the initial demo password. Guest sign-in requires a confirmed, active, or completed stay.

New reservations create guest accounts at confirmation. The final wizard step displays downloadable credentials. Existing guests retain their account and password. Owner → Accounts & team provides credential viewing, simulated password resets, activation, and deactivation. New and reset passwords honor the configured minimum password length by padding the base demo password with `!`.

## Workspaces

- **Management:** operational dashboard; manual reservation wizard; approvals; arrivals, check-in, extension, transfer, checkout, cancellations and no-shows; rooms and seven-day availability calendar; guest profiles; staff shifts and performance; cleaning, maintenance, inspection and property tasks; service routing; support and reviews; promotions and seasonal offers; folios, payments, refunds, invoices, reports and resort details.
- **Guest:** current stay dashboard; prefilled editable profile and simulated identity upload; booking tabs and change requests; four-stage service workflow; itemized stay billing and simulated payment gateway; printable invoice downloads; support tracking and notifications; completed-stay resort, room and service ratings; rewards, redemption, tiers and transaction history.
- **Staff:** one workspace with role-specific navigation and assignments. Reception handles reservations and the front desk; Housekeeping handles cleaning and inspection requests; Cashier handles folios and payments; Maintenance and Gardener handle assigned work and issue reporting; F&B and Spa process assigned services and charges.
- **Owner:** executive dashboard and record-derived charts; financial ledger and expense entry; time-filtered reports with CSV export; resort profile, taxes, cancellation notice and discount rules; room rates; account controls; role-permission matrix; searchable audit log; simulated integrations and security settings.

## Verify the main journey

1. In Management → Reservations, create a new guest reservation for an available room starting today. Review the dates, pricing and credentials.
2. Sign in with the issued guest email and password. The confirmed stay is visible.
3. Switch to Management or Receptionist, open the reservation and **Check in**. The room must be inspection-approved.
4. Sign back in as that guest and request a service, such as a Balinese massage.
5. Switch to Staff → Spa. Open the assigned service, **Accept request → Start service → Complete & add charge**.
6. Open the guest folio as Guest, Cashier or Management. The completed service appears once. Simulate a payment for the outstanding amount and download the invoice.
7. Return to the reservation and **Check out**. Unfinished services and unsettled balances must be resolved first. Checkout awards points and creates a housekeeping turnover task.
8. The guest can now review the stay and see the earned rewards. Owner reports and audit records reflect the payment and operational actions.
9. Housekeeping starts the turnover task and requests an inspection. Management approves it to make the room Ready again.

### Additional scenarios

- **Cancellation / changes:** guests submit a request from booking details. Management approves or declines it in Reservations. Cancellation notice follows the Owner policy; reception can manually cancel a confirmed booking. Existing receipts remain available for authorized refunds.
- **No-show:** a confirmed reservation can be marked no-show only after its scheduled arrival day. This case is covered by the domain tests with a controlled date fixture.
- **Extension / transfer:** use Edit / transfer on a live reservation. Overlapping dates and out-of-service rooms are rejected. Active transfers require a ready room and create cleaning work for the old room. The original contracted nightly rate is retained.
- **Maintenance:** report an issue against an unoccupied room. It becomes unavailable until work and a management inspection are complete. Occupied rooms require a guest transfer first. Damage reports can be logged without immediately blocking a room.
- **Refund:** Management and Owner have refund permission initially. Cashier refunds appear only if the Owner enables that permission. Refunds require a reason and cannot exceed net payments received.
- **Permissions:** disable a permission in Owner → Roles & permissions, switch to the affected role, and verify that both navigation and direct-route access reflect the change. Commands check permissions again before changing data.
- **Persistence / reset:** refresh the page or open another tab on the same origin. Changes persist in localStorage and storage events synchronize tabs. Profile menu → Reset demo data restores the entire linked seed.

## Data and business rules

The seed contains **30 rooms, 20 guests, 25 reservations and 14 staff**, plus services, payments, tasks, complaints, reviews, promotions, expenses and loyalty records. Seed dates are relative to the date the demo is initialized. Reset after a long interval to regenerate a current-day scenario.

All writes pass through an immutable shared command layer. It checks room/date overlaps, guest scope, role permissions, permitted transitions, readiness, payment/refund bounds and loyalty balances. Completed services are derived into the bill instead of appending duplicate charge rows. Failed commands leave the prior state unchanged. Tax rates are fixed per reservation, while new reservations use the latest policy. Amounts are in INR; invoice taxes are rounded to whole rupees.

Reports derive from the shared records. Cash collections are payments less refunds; expenses are their own dated ledger. Booked revenue and taxes use reservations arriving within the selected period. Historical occupancy is reserved room nights, excluding cancelled/no-show reservations. Report labels distinguish these measures.

Room discovery, self-registration, and advance payment collection are outside this app. The seed includes explicitly labeled advances previously received outside RRMS. New simulated stay payments unlock after check-in.

## Implementation

- React 19, TypeScript, Vite, React Router
- Tailwind CSS 4 and locally customized shadcn/ui-style Radix primitives (Button, Dialog, Dropdown Menu)
- Framer Motion page transitions, animated counters, CSS card/modal transitions and reduced-motion support
- Recharts for record-derived interactive charts; Lucide icons; Sonner status feedback
- `src/lib/domain.ts`: typed records, seed, derived totals, permission and business-rule command layer
- `src/lib/store.tsx`: shared React store, demo authentication, persistence and cross-tab updates
- `src/components/`: accessible UI primitives and responsive application shell
- `src/pages/`: shared operational screens and module-specific experiences
- `tests/domain.test.ts`: business rules and linked lifecycle coverage
- `tests/e2e/resort.spec.ts`: actual forms, module navigation, role restrictions, downloads, persistence and responsive layout

Frontend authentication and authorization are intentionally simulated. This is not a production security boundary. Passwords and mock records are stored locally, and payment, document, email and SMS actions do not contact external services. Identity uploads retain filenames only. Downloaded invoices are standalone printable HTML with a Print / Save as PDF button; exports use CSV with formula-injection escaping.

The interface has keyboard-operable dialogs, menus and tabs, labeled controls, focus states, skip navigation, lazy-screen skeletons, empty states and responsive mobile navigation. Resort imagery is bundled locally, so the running app does not depend on an image CDN.

Photo sources: [resort photograph](https://images.unsplash.com/photo-1571896349842-33c89424de2d), [suite photograph](https://images.unsplash.com/photo-1611892440504-42a792e24d32), via Unsplash. They are illustrative demo property images.
