# FINAL FULL-SYSTEM QA, TESTING & COMPLETION PROMPT

You are now in the **FINAL QA, INTEGRATION TESTING, FEATURE COMPLETION AND PRE-NEXT-PHASE VERIFICATION** stage of the AI QR Menu SaaS.

Your job is NOT simply to inspect the application and give me a list of problems.

Your job is to:

> **Inspect → Test → Identify gaps → Fix them → Retest → Verify → Only then move to the next phase.**

Do not assume that a feature is complete merely because a page exists.

A feature is considered complete only when:

1. The UI exists.
2. The UI is connected to the correct backend functionality.
3. The database functionality works.
4. Authentication/authorization works.
5. The feature works for the correct restaurant tenant.
6. Error/loading/empty/success states exist.
7. The feature works on responsive layouts.
8. The complete user flow works end-to-end.
9. Security requirements are respected.
10. The feature has been tested after implementation.

---

# 1. SOURCE OF TRUTH

Use the existing project implementation and the complete AI QR Menu SaaS specification as the source of truth.

The product is:

> AI Menu Digitization + Dynamic QR Menu + Customer Ordering + Telegram Order Notifications.

Do not remove already-working functionality.

Do not replace working architecture unnecessarily.

Do not introduce unrelated features.

If an existing implementation differs from the intended architecture, determine whether it is functionally safe and maintainable before changing it.

---

# 2. FIRST: COMPLETE PROJECT AUDIT

Before making changes, inspect the entire application.

Inspect:

- All routes
- All pages
- All layouts
- All components
- All forms
- All API routes
- Server actions
- Database schema
- Supabase configuration
- Authentication
- Authorization
- RLS policies
- Gemini integration
- Cloudinary integration
- Telegram integration
- QR generation
- Customer menu
- Cart
- Checkout
- Orders
- Settings
- Environment variables
- Error handling
- Loading states
- Responsive behavior

Create an internal feature checklist.

Do NOT stop after checking whether routes exist.

Trace each important UI action into its backend/database effect.

---

# 3. PAGE INVENTORY VERIFICATION

Verify that all required pages actually exist and are reachable.

## Public / Marketing

- Landing page

## Authentication

- Login
- Signup
- Forgot/reset password if implemented
- Authentication error states

## Restaurant Portal

- Dashboard
- Restaurant onboarding
- Menu
- My Menu
- Import Menu
- AI Processing
- AI Review
- Add Item
- Edit Item
- Orders
- Order Details
- QR Code
- Settings
- Restaurant Settings
- Telegram Settings
- Notification Settings

## Customer Portal

- Restaurant Menu
- Search
- Category browsing
- Item details
- Cart
- Checkout
- Order Confirmation
- Order Status

## Required states

Verify:

- Loading
- Empty
- Error
- Success
- Disabled
- Validation
- Confirmation dialogs
- Not found
- Unpublished restaurant
- Unavailable item

If a required page or state is missing:

> BUILD IT NOW.

Do not merely report it.

---

# 4. LANDING PAGE QA

Verify:

- Headline
- Supporting text
- Create Your Menu CTA
- View Demo CTA
- Responsive design
- Navigation
- Authentication links
- No broken links
- No placeholder content
- Good visual hierarchy

The primary value proposition should remain clear:

> Turn your restaurant menu into a QR menu in minutes.

Fix any incomplete UI.

---

# 5. AUTHENTICATION QA

Test:

### Signup

- Valid signup
- Invalid email
- Weak password
- Duplicate account
- Missing fields
- Loading state
- Error state
- Success state

### Login

- Correct credentials
- Incorrect credentials
- Empty fields
- Session persistence
- Logout

### Authorization

Verify that unauthenticated users cannot access owner dashboard pages.

Verify authenticated users cannot access another owner's restaurant data.

If authentication or authorization is incomplete:

> FIX IT NOW AND RETEST.

---

# 6. MULTI-TENANT SECURITY TEST

This is mandatory.

Create/test at least two logical restaurants:

```text
Restaurant A
restaurant_id = A

Restaurant B
restaurant_id = B
```

Verify:

- A cannot see B's menu
- A cannot edit B's menu
- A cannot delete B's menu
- A cannot see B's orders
- A cannot modify B's orders
- A cannot access B's settings
- A cannot access B's Telegram connection
- A cannot manipulate B's QR/menu
- API requests cannot bypass ownership

Never trust `restaurant_id` supplied by the frontend.

Backend must derive/verify ownership from the authenticated session.

Verify Supabase RLS policies as well.

If tenant isolation fails:

> FIX IT BEFORE CONTINUING.

---

# 7. RESTAURANT ONBOARDING QA

Test:

```text
Signup
 ↓
Create Restaurant
 ↓
Restaurant Details
 ↓
Upload Menu
 ↓
AI Processing
 ↓
Review
 ↓
Publish
 ↓
QR
 ↓
Telegram
```

Verify the entire flow can be completed without dead ends.

Check:

- Restaurant name
- Slug generation
- Slug uniqueness
- Logo
- Description
- Address
- Phone
- Save/update
- Validation
- Loading states
- Error handling

---

# 8. AI MENU IMPORT QA

Test the complete Gemini workflow.

### Upload

Verify:

- JPG
- PNG
- PDF if supported
- Multiple pages
- Invalid file
- Oversized file
- Empty upload
- Poor quality menu

### AI processing

Verify:

- Gemini is actually called
- API key stays server-side
- Errors are handled
- Timeout/failure is handled
- Response is validated
- Invalid AI JSON does not break the application

AI should extract:

- Categories
- Item names
- Prices
- Descriptions
- Multiple menu pages

AI must NOT invent missing information.

Missing/uncertain information must be flagged for review.

---

# 9. AI PROCESSING UI QA

Verify meaningful progress:

```text
✓ Upload complete
✓ Reading menu
● Extracting items
○ Organizing categories
○ Preparing review
```

Verify:

- Loading state
- Processing failure
- Retry
- Success
- No infinite spinner
- User cannot accidentally submit duplicate processing jobs

After completion:

```text
Your menu is ready!

24 items detected
6 categories detected
3 items need review

[ Review Menu ]
```

---

# 10. AI REVIEW QA

Verify:

- All extracted categories appear
- All extracted items appear
- Prices are correct
- Descriptions are editable
- Categories are editable
- Missing values are flagged
- Suspicious/uncertain values are flagged
- Duplicate items can be corrected
- Items can be deleted
- Items can be added manually
- Draft can be saved

Most importantly:

> AI must NEVER automatically publish a menu without owner review.

Test:

```text
AI extraction
 ↓
Review
 ↓
Correction
 ↓
Save
 ↓
Publish
```

---

# 11. MENU MANAGEMENT QA

Test:

- Add category
- Edit category
- Delete category
- Reorder category
- Add item
- Edit item
- Delete item
- Reorder items
- Change price
- Change description
- Upload item image
- Change item image
- Availability toggle

Verify database persistence after page refresh.

Verify changes appear on the public menu.

---

# 12. CLOUDINARY QA

Verify image architecture.

Correct flow:

```text
Frontend
 ↓
Backend
 ↓
Cloudinary
 ↓
Optimized URL
 ↓
Supabase
```

Do NOT store large image binaries directly inside PostgreSQL.

Verify:

- Upload
- Successful URL storage
- Invalid image
- Upload failure
- Image replacement
- Image deletion where applicable
- Optimized rendering
- Mobile performance

Ensure Cloudinary secrets are never exposed to the browser.

---

# 13. MENU PUBLISHING QA

Test:

```text
Draft
 ↓
Publish
```

and:

```text
Published
 ↓
Unpublish
```

Verify:

- Draft menus are not publicly accessible
- Published menus are publicly accessible
- Unpublished menus stop being publicly accessible
- Changes after publishing are reflected correctly

---

# 14. DYNAMIC QR QA

QR must point to a stable restaurant URL such as:

```text
/menu/sharma-cafe
```

NOT encode the menu itself.

Test:

1. Generate QR.
2. Scan/open it.
3. Verify correct restaurant.
4. Change menu.
5. Scan same QR.
6. Verify updated menu appears.

Verify:

- QR preview
- Download QR
- Copy menu URL
- Test scan
- Invalid slug
- Unpublished restaurant
- Restaurant slug changes if supported

---

# 15. CUSTOMER MENU QA

Test mobile-first experience.

Verify:

- Restaurant branding
- Restaurant name
- Open/closed state if implemented
- Search
- Category chips
- Item cards
- Item descriptions
- Prices
- Images
- Availability
- Add button
- Item details

Test:

- No menu items
- No search results
- Unavailable item
- Invalid restaurant
- Loading
- Network error

Customer should NOT need an account.

---

# 16. SEARCH QA

Verify:

- Item name search
- Partial search
- Case-insensitive search
- Empty search
- No results
- Search while categories exist

Search should not expose private restaurant information.

---

# 17. CART QA

Test:

```text
Add item
Increase quantity
Decrease quantity
Remove item
Add multiple items
```

Verify:

- Correct quantities
- Correct subtotal
- Correct total
- Empty cart
- Cart persistence during navigation
- Unavailable item handling
- Price changes

Never trust cart totals from the frontend.

---

# 18. CHECKOUT QA

Verify:

Fields:

- Table number
- Customer name
- Customer phone

Table number should be required if that is the configured MVP behavior.

Test:

- Missing table
- Invalid table
- Optional name
- Optional phone
- Valid checkout
- Invalid checkout
- Double-click Place Order
- Slow network
- Failed request

---

# 19. ORDER SECURITY QA

This is mandatory.

Attempt to manipulate:

```text
price
total
restaurant_id
menu_item_id
quantity
```

from the browser/network request.

Backend must:

1. Identify restaurant.
2. Validate menu item.
3. Verify item belongs to restaurant.
4. Verify item is available.
5. Fetch current price from database.
6. Calculate total server-side.
7. Create order.
8. Store `price_at_order`.

Frontend values must NEVER determine the final order price.

---

# 20. ORDER DATABASE QA

Verify:

```text
orders
order_items
```

are correctly created.

Test:

- One item
- Multiple items
- Multiple quantities
- Correct subtotal
- Correct total
- Correct restaurant_id
- Correct table
- Correct timestamps
- Correct price_at_order

Test failure halfway through the order process.

Avoid partially corrupted orders.

---

# 21. RESTAURANT ORDERS PAGE QA

Verify:

- Orders list
- New orders
- Order details
- Table number
- Items
- Quantities
- Price
- Total
- Status
- Timestamp

Verify filtering/sorting if implemented.

Test:

```text
pending
accepted
rejected
completed
```

If the MVP supports:

```text
preparing
ready
cancelled
```

test those too.

---

# 22. TELEGRAM INTEGRATION — FULL QA

This section is CRITICAL.

Verify the architecture uses:

> ONE Telegram bot for the entire SaaS.

The restaurant owner must NOT be asked for a Telegram Bot API key.

The SaaS owns:

```text
TELEGRAM_BOT_TOKEN
```

It must remain server-side.

---

# 23. TELEGRAM CONNECTION FLOW

Verify the complete connection flow:

```text
Owner logs in
 ↓
Settings
 ↓
Telegram Orders
 ↓
Connect Telegram
 ↓
Backend creates unique connection token
 ↓
Telegram deep link opens
 ↓
Owner presses Start
 ↓
Telegram sends /start token
 ↓
Webhook receives it
 ↓
Backend validates token
 ↓
Backend obtains chat_id
 ↓
chat_id linked to restaurant
 ↓
Dashboard shows Connected
```

The connection must be restaurant-specific.

Example:

```text
Restaurant A
telegram_chat_id = 123

Restaurant B
telegram_chat_id = 456
```

Restaurant A must never receive Restaurant B's orders.

---

# 24. TELEGRAM SETTINGS UI

Verify the settings page contains:

```text
Telegram Orders

Status
🔴 Not Connected

[ Connect Telegram ]
```

After connection:

```text
Telegram Orders

🟢 Connected

Orders will be sent to:
Connected Telegram account

[ Send Test Order ]

[ Disconnect ]
```

Verify:

- Connecting state
- Connected state
- Failed connection
- Disconnect
- Reconnect
- Test notification

If missing:

> BUILD IT NOW.

---

# 25. TELEGRAM SECURITY QA

Verify:

- Bot token is never sent to frontend
- Bot token is never rendered in UI
- Bot token is not stored in client-side code
- Environment variables are used
- Telegram callback data is validated
- Connection tokens cannot be reused maliciously
- Connection token expires or is invalidated appropriately
- Telegram chat belongs to the intended restaurant
- Restaurant ownership is verified before sending messages

---

# 26. TELEGRAM ORDER NOTIFICATION QA

Place a real test order.

Verify the correct restaurant receives:

```text
🔔 NEW ORDER #1048

🏪 Sharma Cafe
🪑 Table: 7

🍕 Margherita × 2     ₹398
🥤 Cold Coffee × 1    ₹120
🍟 French Fries × 1   ₹149

Total: ₹667
```

Verify:

- Correct restaurant
- Correct order ID
- Correct table
- Correct items
- Correct quantities
- Correct prices
- Correct total

---

# 27. TELEGRAM FAILURE QA

Simulate Telegram failure.

Expected behavior:

```text
Customer places order
 ↓
Order saved successfully
 ↓
Telegram notification fails
 ↓
Order STILL EXISTS
```

Do NOT delete/rollback a valid order simply because Telegram failed.

Log the failure and provide a retry mechanism where appropriate.

---

# 28. TELEGRAM ACCEPT/REJECT QA

If inline buttons are implemented:

```text
[ ✅ Accept ] [ ❌ Reject ]
```

test both.

Accept:

```text
pending → accepted
```

Reject:

```text
pending → rejected
```

Verify:

- Correct order
- Correct restaurant
- Correct owner
- Valid status transition
- Unauthorized callback rejected
- Duplicate callback handled safely

---

# 29. CUSTOMER ORDER STATUS QA

After restaurant accepts:

```text
Customer
 ↓
Order Status
 ↓
Accepted
```

Verify the customer sees the updated status.

Test:

```text
pending
accepted
rejected
completed
```

If real-time updates are used, test the real-time connection.

If polling is used, verify refresh behavior.

---

# 30. DASHBOARD QA

Verify:

```text
Total Items
Categories
Menu Status
Orders Today
```

and:

```text
Recent Orders
Quick Actions
Telegram Status
```

All values must come from actual backend data.

No fake/demo numbers should remain unless intentionally part of a demo mode.

Verify dashboard data is restaurant-specific.

---

# 31. SETTINGS QA

Verify settings contain appropriate sections:

```text
Restaurant
Telegram Orders
Notifications
Account
```

Test:

- Restaurant profile updates
- Telegram connect/disconnect
- Notification preferences
- Account information
- Save/cancel behavior
- Validation
- Error states

---

# 32. RESPONSIVE QA

Test the entire application at:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Pay special attention to:

- Customer menu
- Search
- Cart
- Checkout
- AI review
- Menu management
- Orders
- Telegram settings
- Dashboard sidebar

Fix:

- Horizontal overflow
- Tiny text
- Tiny buttons
- Broken cards
- Overlapping elements
- Unusable mobile tables
- Modal overflow
- Sticky cart problems

---

# 33. UI/UX QA

The design should be:

- Modern
- Clean
- Professional
- Consistent
- Accessible
- Fast
- Food-focused

Verify:

- Typography consistency
- Spacing
- Button consistency
- Form consistency
- Card consistency
- Status badges
- Toasts
- Modals
- Empty states
- Error states
- Loading states

Avoid:

- Excessive gradients
- Excessive animations
- Excessive glassmorphism
- Tiny controls
- Overloaded dashboard
- Confusing navigation

---

# 34. ACCESSIBILITY QA

Verify:

- Keyboard navigation
- Visible focus states
- Proper labels
- Form accessibility
- Button accessibility
- Image alt text
- Color contrast
- Error messages
- Touch target sizes

Do not rely on color alone for statuses.

---

# 35. API QA

Audit every API route.

Verify:

- Authentication
- Authorization
- Input validation
- Error responses
- Correct HTTP methods
- Correct status codes
- Tenant isolation
- Rate limiting where appropriate
- No secret leakage
- No stack traces exposed to users

Test invalid requests intentionally.

---

# 36. DATABASE QA

Verify schema and relationships.

Check:

```text
restaurants
menu_categories
menu_items
orders
order_items
```

Verify foreign keys and ownership.

Verify:

```text
restaurant_id
```

is correctly propagated.

Verify indexes exist where useful.

Verify RLS policies.

Test unauthorized database access.

---

# 37. ENVIRONMENT / SECRET QA

Audit environment variables.

Expected categories include:

```text
SUPABASE
GEMINI
CLOUDINARY
TELEGRAM
```

Verify secrets are:

- Server-side
- Not hardcoded
- Not committed
- Not displayed in UI
- Not returned by APIs

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
CLOUDINARY_API_SECRET
TELEGRAM_BOT_TOKEN
```

---

# 38. ERROR HANDLING QA

Intentionally break:

- Gemini request
- Cloudinary upload
- Supabase request
- Telegram request
- Invalid API request
- Network connection
- Invalid route
- Missing database record

Every failure should result in a useful user-facing state.

Avoid:

```text
Something went wrong.
```

when a more useful message can safely be shown.

Provide retry actions where appropriate.

---

# 39. PERFORMANCE QA

Check:

- Initial page loading
- Customer menu loading
- Image sizes
- API response times
- AI processing UX
- Dashboard loading
- Large menus
- Cart performance

Do not unnecessarily load the entire restaurant dataset when only public menu data is required.

Use optimized images.

Avoid unnecessary client-side requests.

---

# 40. SECURITY PENETRATION-STYLE CHECK

Perform a practical security review.

Attempt:

- Access another restaurant's URL
- Modify another restaurant's item
- Delete another restaurant's item
- Read another restaurant's orders
- Change order price
- Change restaurant_id
- Forge Telegram callback
- Reuse connection token
- Access protected APIs without authentication
- Access secrets through browser
- Submit invalid quantities
- Submit unavailable items
- Submit nonexistent item IDs

Every unauthorized operation must fail safely.

---

# 41. DATA CONSISTENCY TEST

Test:

### Menu price change

```text
Item = ₹199
 ↓
Order
 ↓
price_at_order = ₹199
 ↓
Change menu to ₹249
 ↓
Old order remains ₹199
```

### Menu availability

```text
Available
 ↓
Customer adds item
 ↓
Restaurant marks unavailable
 ↓
Customer attempts checkout
 ↓
Backend rejects unavailable item
```

### Menu deletion

Ensure historical orders remain readable even if a menu item is later removed, using stored order-item information appropriately.

---

# 42. END-TO-END GOLDEN TEST

Run this exact scenario from beginning to end.

```text
1. Create restaurant owner account.

2. Create:
   Sharma Cafe

3. Upload menu.

4. Run Gemini extraction.

5. Verify extracted categories/items.

6. Review AI output.

7. Correct an AI mistake.

8. Save menu.

9. Publish menu.

10. Generate QR.

11. Open QR URL.

12. Verify customer menu.

13. Search Pizza.

14. Add:
    Margherita × 2

15. Add:
    Cold Coffee × 1

16. Open cart.

17. Verify total.

18. Checkout.

19. Enter:
    Table 7

20. Place order.

21. Verify server-side price calculation.

22. Verify order saved.

23. Verify Telegram notification.

24. Restaurant accepts order.

25. Verify order status changes.

26. Verify customer sees Accepted.

27. Restaurant completes order.

28. Verify customer sees Completed.

29. Change menu price.

30. Verify old order still has old price.

31. Scan same QR.

32. Verify new menu price appears.

33. Logout.

34. Verify dashboard is protected.
```

This golden test must PASS.

---

# 43. FIX POLICY

Whenever you discover:

### Missing feature

BUILD IT.

### Broken feature

FIX IT.

### Security vulnerability

FIX IT immediately before continuing.

### Missing UI state

ADD IT.

### Broken responsive layout

FIX IT.

### Backend/UI mismatch

FIX THE INTEGRATION.

### Placeholder implementation

Replace it with the actual implementation if it is part of the MVP.

### Unnecessary feature

Do not expand scope unless it is required for an existing MVP workflow.

---

# 44. RETEST POLICY

After every significant fix:

1. Retest the affected feature.
2. Retest its dependent feature.
3. Retest the relevant end-to-end flow.

Do not assume a fix works.

Example:

If Telegram connection is fixed:

```text
Reconnect Telegram
 ↓
Send test notification
 ↓
Place order
 ↓
Receive Telegram notification
 ↓
Accept order
 ↓
Verify customer status
```

---

# 45. REGRESSION TEST

After all fixes, run the complete regression suite again.

Verify:

```text
Auth
↓
Onboarding
↓
Menu
↓
AI
↓
Review
↓
Publish
↓
QR
↓
Customer Menu
↓
Cart
↓
Checkout
↓
Orders
↓
Telegram
↓
Order Status
↓
Settings
```

No previously working feature should be broken by a later fix.

---

# 46. FINAL COMPLETION GATE

Do NOT declare the project complete unless:

- All required pages exist
- All required pages are connected
- All MVP features work
- AI workflow works
- AI review works
- Menu CRUD works
- QR works
- Customer menu works
- Cart works
- Checkout works
- Orders work
- Telegram connection works
- Telegram notifications work
- Telegram Accept/Reject works if implemented
- Customer status works
- Multi-tenancy works
- Authentication works
- Authorization works
- RLS works
- Secrets are protected
- Server-side price calculation works
- Error handling works
- Responsive UI works
- Loading/empty/error/success states exist
- Golden end-to-end test passes
- Regression test passes

---

# 47. FINAL REPORT

Only after completing all fixes and tests, provide a final report with:

## Overall Status

```text
PASS / FAIL
```

## Pages

```text
X / X complete
```

## Features

```text
X / X complete
```

## Critical Bugs

```text
0
```

or list remaining critical issues.

## Security

```text
PASS / NEEDS FIX
```

## Telegram

```text
Connection: PASS
Notification: PASS
Accept/Reject: PASS
Security: PASS
```

## AI

```text
Extraction: PASS
Review: PASS
Error handling: PASS
```

## Multi-tenancy

```text
PASS
```

## Responsive UI

```text
PASS
```

## Golden Test

```text
PASS
```

---

# 48. NEXT-PHASE RULE

If everything passes:

> Declare the current phase COMPLETE and proceed to the next phase of development.

If anything is missing:

> Fix it immediately, retest it, and then continue.

Do NOT stop at:

```text
"I found these issues..."
```

Instead do:

```text
"I found these issues → fixed them → retested them → verified them."
```

The objective is a **working, integrated, production-quality MVP**, not merely a list of TODOs.

---

# FINAL INSTRUCTION

Start the audit now.

Do not ask me for confirmation for normal implementation decisions.

Inspect the existing implementation first.

Make the necessary fixes yourself.

Test every major workflow.

Pay special attention to:

1. Multi-tenancy
2. AI menu extraction/review
3. Dynamic QR
4. Customer ordering
5. Server-side order validation
6. Telegram connection
7. Telegram notifications
8. Telegram Accept/Reject
9. Customer order status
10. Authentication/security
11. Responsive UI
12. Missing pages and states

After fixing everything, run the complete regression and golden end-to-end test.

Only when the system passes the completion gate should you move to the next development phase.