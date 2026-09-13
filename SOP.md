# SOP — AI QR MENU + ONLINE ORDERING SAAS
## Final Product & Engineering Specification

==================================================
1. PROJECT OVERVIEW
==================================================

Build a SaaS platform for restaurants and cafes that converts their existing physical menu into a professional digital QR menu using AI.

Core product promise:

"Give us your existing menu. We'll turn it into a digital QR menu in minutes."

The platform must allow a restaurant owner to:

1. Create an account.
2. Create their restaurant.
3. Upload menu photos/PDFs.
4. Use Google's Gemini free model for AI/Vision menu extraction.
5. Review and correct the AI-generated menu.
6. Publish the menu.
7. Generate a dynamic QR code.
8. Place the QR code in the restaurant.
9. Let customers scan the QR using their phone camera.
10. Let customers browse the digital menu.
11. Let customers add items to a cart.
12. Let customers place an order.
13. Save the order in the backend.
14. Send the order to the restaurant through a Telegram Bot.
15. Allow the restaurant to accept/reject the order through Telegram later.

The initial MVP should focus on:

AI Menu Digitization
+
Dynamic QR Menu
+
Online Ordering
+
Telegram Order Notifications


==================================================
2. PRIMARY PRODUCT PRINCIPLE
==================================================

The restaurant should not have to manually recreate its existing menu.

The ideal flow is:

Physical Menu
      ↓
Upload Photo/PDF
      ↓
Gemini AI/Vision
      ↓
Structured Menu
      ↓
Restaurant Reviews
      ↓
Restaurant Publishes
      ↓
Dynamic QR
      ↓
Customer Scans
      ↓
Digital Menu
      ↓
Cart
      ↓
Order
      ↓
Telegram Notification


==================================================
3. TARGET USERS
==================================================

There are two primary users.

A. RESTAURANT OWNER

The restaurant owner manages:

- Restaurant profile
- Menu
- Categories
- Menu items
- Prices
- Images
- Availability
- QR code
- Orders
- Telegram connection
- Settings

B. CUSTOMER

The customer should be able to:

- Scan QR
- Open menu
- Search menu
- Browse categories
- View items
- Add items to cart
- Checkout
- Place order
- View order status

Customer should NOT need:

- Mobile app
- Account
- Password
- Mandatory login

The customer experience must be mobile-first.


==================================================
4. HIGH-LEVEL ARCHITECTURE
==================================================

Recommended MVP architecture:

                    CUSTOMER
                       │
                       │ Scan QR
                       ▼
              ┌──────────────────┐
              │    Next.js App   │
              │ Customer Menu UI │
              └────────┬─────────┘
                       │
                       ▼
                Backend / API
                       │
          ┌────────────┼─────────────┐
          │            │             │
          ▼            ▼             ▼
      Supabase     Cloudinary    Gemini AI
      PostgreSQL      Images      / Vision
          │
          ▼
        Orders
          │
          ▼
    Telegram Bot API
          │
          ▼
     Restaurant


TECHNOLOGY STACK:

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS

Backend:
- Next.js API Routes / Server Actions

Database:
- Supabase PostgreSQL

Authentication:
- Supabase Auth

Image Storage:
- Cloudinary

AI:
- Google Gemini free model
- Use Gemini for menu image/PDF understanding and structured extraction

QR:
- QR code generated from restaurant's dynamic URL

Notifications:
- Telegram Bot API

Hosting:
- Vercel during development/MVP


==================================================
5. AI MODEL
==================================================

Use Google's Gemini free model for AI menu extraction.

Gemini should be responsible for:

- Reading menu images
- Reading menu PDFs where supported
- Identifying categories
- Identifying menu item names
- Identifying prices
- Extracting descriptions
- Understanding multiple menu pages
- Returning structured JSON
- Identifying uncertain/ambiguous values where possible

Do NOT make AI extraction directly publish the menu.

The flow must always be:

Upload
→ Gemini Processing
→ Structured Extraction
→ Human Review
→ Publish


==================================================
6. AI MENU EXTRACTION
==================================================

Restaurant can upload:

- JPG
- JPEG
- PNG
- PDF
- Multiple menu pages

Example:

page1.jpg
page2.jpg
page3.jpg

Gemini should return structured data.

Example:

{
  "categories": [
    {
      "name": "Pizzas",
      "items": [
        {
          "name": "Margherita",
          "description": "Fresh tomato, mozzarella and basil",
          "price": 199
        },
        {
          "name": "Farmhouse",
          "description": "Onion, capsicum and mushroom",
          "price": 249
        }
      ]
    }
  ]
}


==================================================
7. AI EXTRACTION RULES
==================================================

The AI should NOT invent information.

If something cannot be confidently read:

Do not hallucinate it.

Example:

{
  "name": "Special Pasta",
  "price": null,
  "confidence": "low"
}

The UI should then tell the restaurant owner:

"Price needs review."


Potential extraction fields:

- category
- item name
- description
- price
- currency
- availability if clearly indicated
- dietary indicator if clearly visible
- confidence


==================================================
8. HUMAN VERIFICATION
==================================================

Every AI-generated menu must go through a review screen.

Example:

--------------------------------
REVIEW YOUR MENU

PIZZAS

Margherita
Fresh tomato & mozzarella
₹199
✓ Verified

Farmhouse
Onion, capsicum & mushroom
₹249
✓ Verified

Special Pasta
Price missing
⚠ Needs Review

[Edit] [Edit] [Edit]

--------------------------------

The owner must be able to:

- Edit category
- Edit item name
- Edit description
- Edit price
- Delete item
- Add item
- Move item to category
- Add image
- Change availability

Only after review:

[Publish Menu]


==================================================
9. RESTAURANT ONBOARDING
==================================================

Keep onboarding extremely simple.

STEP 1:

Welcome

Restaurant Name
[________________]

[Continue]


STEP 2:

Upload your menu

"Upload photos or PDF of your existing menu."

[Upload Menu]


STEP 3:

AI PROCESSING

Show actual progress:

✓ Upload complete
✓ Reading menu
● Extracting items
○ Organizing categories
○ Preparing review


STEP 4:

Menu ready.

Example:

24 items detected
6 categories detected
3 items need review

[Review Menu]


STEP 5:

After review:

Your menu is ready!

[Publish Menu]


STEP 6:

Menu published.

Your QR menu is live.

[View Menu]
[Get QR Code]


==================================================
10. RESTAURANT DASHBOARD
==================================================

Create a modern SaaS dashboard.

Sidebar:

Dashboard

Menu
  - My Menu
  - Import Menu
  - Add Item

Orders

QR Code

Settings


Dashboard cards:

Total Items
24

Categories
6

Menu Status
● Live

QR Scans
1,284

Orders Today
37


Also show:

- Recent orders
- Quick actions
- Menu status
- Telegram status


==================================================
11. MENU MANAGEMENT
==================================================

Restaurant owner can:

- Create category
- Rename category
- Delete category
- Reorder category
- Add item
- Edit item
- Delete item
- Change price
- Change description
- Upload image
- Mark unavailable
- Reorder items

Example:

PIZZAS
--------------------------------

Margherita
Fresh tomato & mozzarella
₹199

[Available] [Edit]


Farmhouse
Onion, capsicum & mushroom
₹249

[Available] [Edit]


==================================================
12. DATABASE DESIGN
==================================================

Use one PostgreSQL database.

Do NOT create a separate database for every restaurant.

Use multi-tenancy using restaurant_id.


TABLE: restaurants

id
owner_id
name
slug
logo_url
description
address
phone
telegram_chat_id
telegram_connected
is_published
created_at
updated_at


TABLE: menu_categories

id
restaurant_id
name
sort_order
is_active


TABLE: menu_items

id
restaurant_id
category_id
name
description
price
image_url
is_available
sort_order
created_at
updated_at


TABLE: orders

id
restaurant_id
table_number
customer_name
customer_phone
status
total_amount
created_at
updated_at


TABLE: order_items

id
order_id
menu_item_id
quantity
price_at_order


==================================================
13. IMPORTANT PRICE RULE
==================================================

Always store:

price_at_order

Example:

Today:

Pizza = ₹199

Customer orders:

Pizza × 2 = ₹398

Tomorrow restaurant changes:

Pizza = ₹249

Yesterday's order must still show:

Pizza × 2 = ₹398

Therefore order_items must preserve the original price.


==================================================
14. MULTI-TENANCY
==================================================

The application supports multiple restaurants.

Example:

Restaurant A:
restaurant_id = 101

Restaurant B:
restaurant_id = 102


Restaurant A must never see Restaurant B's:

- Menu
- Orders
- Settings
- Telegram configuration
- Dashboard information


Every tenant-owned database table should contain:

restaurant_id


Security rule:

NEVER trust restaurant_id supplied by the frontend.

The backend must determine the restaurant from the authenticated user/session and verify ownership.

Database queries must always be tenant-scoped.


==================================================
15. AUTHENTICATION
==================================================

Use Supabase Auth.

Restaurant owner:

Signup
→ Login
→ Authenticated session
→ Restaurant ownership


Restaurant owner can only access their own restaurant data.


==================================================
16. DYNAMIC QR CODE
==================================================

The QR code must NOT contain the actual menu.

QR should contain a dynamic URL.

Example:

https://yourdomain.com/menu/sharma-cafe


Route:

/menu/[restaurantSlug]


Flow:

QR
 ↓
restaurant slug
 ↓
backend/database
 ↓
restaurant
 ↓
published menu


This means:

Restaurant changes menu
        ↓
Database changes
        ↓
Same QR still works


Restaurant does NOT need to print a new QR every time the menu changes.


==================================================
17. CUSTOMER MENU
==================================================

Customer UI must be mobile-first.

Header:

[Restaurant Logo]

Sharma Cafe

Open Now


Search:

[ 🔍 Search menu ]


Categories:

All
Pizza
Burgers
Drinks
Desserts


Menu item:

----------------------------
[ Food Image ]

Margherita

Fresh tomato & mozzarella

₹199

                         [+]
----------------------------


Customer should easily understand:

- What the item is
- Description
- Price
- Availability
- Add button


==================================================
18. CUSTOMER MENU UX
==================================================

Priorities:

1. Fast loading
2. Easy navigation
3. Large touch targets
4. Clear pricing
5. Good food imagery
6. Minimal distractions
7. No unnecessary login
8. No app installation


Avoid:

- complicated navigation
- excessive animations
- tiny buttons
- huge loading screens
- forced registration


==================================================
19. CART
==================================================

Persistent cart button:

🛒 Cart · 3 items
₹667


Cart:

YOUR ORDER

Margherita × 2
₹398

Cold Coffee × 1
₹120

French Fries × 1
₹149

--------------------

Total
₹667

[Place Order]


Customer can:

- Increase quantity
- Decrease quantity
- Remove item
- See total


==================================================
20. CHECKOUT
==================================================

Keep checkout simple.

Fields:

Table Number
[ 7 ]

Name (optional)
[________]

Phone (optional)
[________]


[Place Order]


If table-specific QR codes are implemented later, table number can be automatically populated.


==================================================
21. ORDER CREATION
==================================================

When customer presses:

Place Order


Flow:

Customer
 ↓
POST /api/orders
 ↓
Validate restaurant
 ↓
Validate menu items
 ↓
Fetch current server-side prices
 ↓
Calculate total
 ↓
Create order
 ↓
Create order_items
 ↓
Send Telegram notification
 ↓
Return success


IMPORTANT:

Never trust the frontend's final total.

Backend must calculate:

quantity × server-side price


This prevents price manipulation.


==================================================
22. ORDER STATUS
==================================================

Initial statuses:

pending
accepted
rejected
completed


Later:

pending
accepted
preparing
ready
completed
cancelled


==================================================
23. TELEGRAM ARCHITECTURE
==================================================

Use ONE Telegram Bot for the SaaS.

Do NOT create one bot for every restaurant.

Architecture:

             YOUR TELEGRAM BOT
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
 Restaurant A   Restaurant B   Restaurant C
 Chat ID A      Chat ID B      Chat ID C


Each restaurant has:

telegram_chat_id
telegram_connected


When an order is created:

Backend finds:

restaurant.telegram_chat_id

Then sends the order to that Telegram chat.


==================================================
24. TELEGRAM ORDER MESSAGE
==================================================

Example:

🔔 NEW ORDER #1048

🏪 Sharma Cafe
🪑 Table: 7

🍕 Margherita × 2
₹398

🥤 Cold Coffee × 1
₹120

🍟 French Fries × 1
₹149

--------------------

Total: ₹667

⏰ 8:42 PM


==================================================
25. TELEGRAM ORDER ACTIONS
==================================================

Later add inline buttons:

[ ✅ Accept ] [ ❌ Reject ]


When restaurant taps Accept:

Telegram
 ↓
Webhook
 ↓
Backend
 ↓
Verify callback
 ↓
Update order status
 ↓
Customer sees:

✓ Order accepted

Your order is being prepared.


==================================================
26. TELEGRAM SECURITY
==================================================

Telegram callback actions must be verified server-side.

Never trust:

restaurant_id
order_id
status

directly from an unverified client.

Backend must verify that:

- Order exists
- Order belongs to the restaurant
- Telegram callback belongs to the connected restaurant
- Requested status transition is valid


==================================================
27. TELEGRAM CONNECTION UI
==================================================

Restaurant dashboard:

Telegram Orders

● Not Connected

Connect Telegram

[Connect]


After connection:

Telegram Orders

● Connected

Orders will be sent to:

Connected Restaurant Chat

[Disconnect]


==================================================
28. IMAGE STORAGE
==================================================

Use Cloudinary.

Architecture:

Restaurant
 ↓
Upload
 ↓
Backend
 ↓
Cloudinary
 ↓
Optimized image
 ↓
image_url
 ↓
Supabase


Database stores:

image_url


not raw image binary.


Use Cloudinary transformations for:

- resizing
- compression
- thumbnails
- responsive images
- CDN delivery


==================================================
29. IMAGE STRATEGY
==================================================

Menu import images are primarily used for AI processing.

Do not unnecessarily keep huge original files forever.

For customer menu images:

Use optimized Cloudinary versions.

Prefer:

thumbnail
medium
large


depending on device/use case.


==================================================
30. AI + IMAGE FLOW
==================================================

Recommended:

Restaurant uploads menu
        ↓
Cloudinary / temporary upload
        ↓
Backend
        ↓
Gemini Vision
        ↓
Structured JSON
        ↓
Validation
        ↓
Review UI
        ↓
Database
        ↓
Published menu


AI extraction should be separated from final database publishing.


==================================================
31. API STRUCTURE
==================================================

Potential API routes:

POST   /api/restaurants
GET    /api/restaurants/:slug

POST   /api/menu/import
POST   /api/menu/publish

GET    /api/menu

POST   /api/menu/categories
PATCH  /api/menu/categories/:id
DELETE /api/menu/categories/:id

POST   /api/menu/items
PATCH  /api/menu/items/:id
DELETE /api/menu/items/:id

POST   /api/orders
GET    /api/orders
PATCH  /api/orders/:id

POST   /api/telegram/connect
POST   /api/telegram/webhook


Exact implementation can use Next.js Route Handlers or Server Actions.


==================================================
32. LANDING PAGE
==================================================

Primary headline:

Turn your restaurant menu into a QR menu in minutes.


Supporting text:

Upload your existing menu.
AI digitizes it.
Review it.
Publish it.
Start accepting orders.


Primary CTA:

[Create Your Menu]


Secondary CTA:

[View Demo]


Landing page should explain:

1. Upload
2. AI digitizes
3. Review
4. Publish
5. Customers scan
6. Orders arrive


==================================================
33. UI/UX DESIGN SYSTEM
==================================================

There are two separate experiences.

------------------------------------------
RESTAURANT SAAS
------------------------------------------

Style:

- Modern
- Clean
- Professional
- Minimal
- SaaS-like
- Desktop-first
- Responsive
- Strong hierarchy


Screens:

Landing
Login
Signup
Onboarding
Dashboard
Import Menu
AI Processing
Review Menu
Menu Management
Add Item
Edit Item
QR Code
Orders
Telegram
Settings


------------------------------------------
CUSTOMER MENU
------------------------------------------

Style:

- Mobile-first
- Fast
- Visual
- Food-focused
- Minimal
- Touch-friendly
- Clear pricing


Screens:

Restaurant Menu
Item Detail
Cart
Checkout
Order Confirmation
Order Status


==================================================
34. UI STATES
==================================================

Every important workflow needs:

Loading
Empty
Error
Success


AI loading:

"AI is reading your menu..."

Menu empty:

"No menu items yet."

Error:

"Something went wrong.
We couldn't process this menu."

Success:

"✓ Menu published.
Your QR menu is now live."


==================================================
35. AI PROCESSING SCREEN
==================================================

Do NOT only show a spinner.

Show meaningful progress:

Importing Menu

✓ Upload complete
✓ Reading menu
● Extracting items
○ Organizing categories
○ Preparing review


After completion:

Your menu is ready!

24 items detected
6 categories detected

3 items need review.

[Review Menu]


==================================================
36. QR CODE SCREEN
==================================================

After publishing:

Your QR Menu is Live!


QR preview


Scan to test


[Download QR]


Also show:

Menu URL

https://yourdomain.com/menu/sharma-cafe


Possible later features:

- Download PNG
- Download SVG
- Print layout
- Table-specific QR codes


==================================================
37. ORDER CONFIRMATION
==================================================

After successful order:

✓ Order Placed

Order #1048

Your order has been sent to the restaurant.

Table 7

Total ₹667


[View Order Status]


==================================================
38. CUSTOMER ORDER STATUS
==================================================

Example:

Order #1048

✓ Order placed

✓ Restaurant accepted

● Preparing

○ Ready


Later this can become a live order tracker.


==================================================
39. RESTAURANT ORDERS PAGE
==================================================

Orders page:

TODAY

#1048
Table 7
₹667
Pending

[View]


#1047
Table 3
₹349
Accepted

[View]


Restaurant can filter:

- Pending
- Accepted
- Preparing
- Completed
- Rejected


==================================================
40. FUTURE DISCOVERY PLATFORM
==================================================

Later the product can become a public restaurant discovery platform.

Potential route:

/explore


Features:

- Nearby restaurants
- Restaurant search
- Dish search
- Veg filter
- Jain filter
- Price comparison
- Reviews
- Offers
- Ordering


IMPORTANT:

Do NOT make this part of the initial MVP.

First prove:

Restaurant
→ Menu
→ QR
→ Customer
→ Order
→ Telegram


==================================================
41. MVP PHASES
==================================================

PHASE 1 — FOUNDATION

Build:

- Next.js project
- Supabase
- Authentication
- Restaurant creation
- Database
- Multi-tenancy
- Basic dashboard


PHASE 2 — AI MENU DIGITIZATION

Build:

- Menu upload
- Gemini integration
- Image/PDF processing
- Structured extraction
- Validation
- Review screen
- Menu editing
- Publish


PHASE 3 — QR MENU

Build:

- Restaurant slug
- Dynamic menu URL
- Customer menu
- Categories
- Search
- Item cards
- QR generation


PHASE 4 — ORDERING

Build:

- Cart
- Checkout
- Order creation
- Order items
- Server-side price validation
- Order status


PHASE 5 — TELEGRAM

Build:

- Telegram Bot
- Restaurant connection
- Chat ID mapping
- Order notifications
- Telegram webhook
- Accept/reject


PHASE 6 — POLISH

Build:

- QR analytics
- Menu analytics
- Table management
- Item availability
- Offers
- Reviews
- Explore page
- Payments/subscriptions


==================================================
42. NON-GOALS FOR MVP
==================================================

DO NOT initially build:

- Native customer app
- Separate database per restaurant
- Separate Telegram bot per restaurant
- Complex kitchen management
- Advanced recommendation engine
- Full restaurant marketplace
- Loyalty system
- Complex payment settlement
- Advanced AI recommendations


==================================================
43. SECURITY REQUIREMENTS
==================================================

Implement:

- Authentication
- Authorization
- Tenant isolation
- Supabase RLS
- Server-side validation
- Server-side price calculation
- Input validation
- Rate limiting where appropriate
- Secure API keys
- Environment variables
- Telegram webhook verification
- Ownership checks


Never expose:

- Gemini API key
- Supabase service-role key
- Telegram bot token
- Cloudinary secrets


to the browser.


==================================================
44. ENVIRONMENT VARIABLES
==================================================

Example:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

TELEGRAM_BOT_TOKEN=


Only public values should use:

NEXT_PUBLIC_


Private secrets must remain server-side.


==================================================
45. PERFORMANCE
==================================================

Customer menu must be optimized for mobile.

Prioritize:

- Fast initial load
- Optimized images
- CDN
- Small API payloads
- Efficient database queries
- Lazy loading where useful
- Responsive images


Avoid:

- huge original images
- unnecessary JavaScript
- unnecessary API calls
- loading all restaurant data
- loading dashboard functionality on customer pages


==================================================
46. DATABASE SECURITY
==================================================

Supabase RLS should enforce restaurant ownership wherever applicable.

Example conceptual rule:

Authenticated user
        ↓
owns restaurant
        ↓
can access restaurant data


Customer public menu access should only expose:

- published restaurant
- active categories
- available/published menu items


Never expose:

- owner information
- private restaurant settings
- Telegram credentials
- internal database IDs unnecessarily
- unpublished data


==================================================
47. RESTAURANT DATA ISOLATION
==================================================

Example:

Restaurant A:

restaurant_id = 101

Restaurant B:

restaurant_id = 102


Restaurant A dashboard:

SELECT *
FROM menu_items
WHERE restaurant_id = 101;


Restaurant B dashboard:

SELECT *
FROM menu_items
WHERE restaurant_id = 102;


Never:

SELECT *
FROM menu_items;


without tenant restrictions in protected contexts.


==================================================
48. CUSTOMER PUBLIC ROUTE
==================================================

Example:

/menu/sharma-cafe


Backend:

1. Find restaurant by slug.
2. Verify restaurant exists.
3. Verify is_published = true.
4. Fetch active categories.
5. Fetch available menu items.
6. Return only public menu information.


==================================================
49. ORDER VALIDATION
==================================================

When order is submitted:

1. Verify restaurant.
2. Verify menu item belongs to restaurant.
3. Verify item is available.
4. Fetch current price from database.
5. Validate quantity.
6. Calculate total server-side.
7. Create order.
8. Create order items.
9. Send Telegram notification.


Never accept:

customer-submitted total_amount

as the authoritative total.


==================================================
50. ERROR HANDLING
==================================================

Handle:

- AI failure
- Invalid image
- Unsupported file
- Poor menu quality
- Gemini API failure
- Cloudinary failure
- Database failure
- Telegram failure
- Invalid order
- Item unavailable
- Restaurant unpublished


If Telegram fails after an order is successfully saved:

The order should NOT disappear.

Order remains saved.

System should mark notification failure internally and provide retry capability later.


==================================================
51. IMPORTANT ORDER RELIABILITY RULE
==================================================

Database order creation and Telegram notification are separate operations.

Correct flow:

Create Order
      ↓
Save Successfully
      ↓
Attempt Telegram
      ↓
If Telegram succeeds:
notification_sent = true

If Telegram fails:
notification_sent = false


The restaurant order must still exist.


==================================================
52. OBSERVABILITY
==================================================

Later add:

- Error logging
- AI extraction logs
- Order logs
- Telegram notification logs
- API request logs
- Analytics


Useful internal information:

order_id
restaurant_id
timestamp
status
telegram_sent
telegram_error


==================================================
53. FREE / LOW-COST INFRASTRUCTURE
==================================================

For development/MVP use free tiers where practical:

- Vercel
- Supabase
- Cloudinary
- Telegram
- Gemini free model/free quota where available


Free tiers have limits.

Before commercial launch, verify the current pricing, quotas, rate limits and commercial-use terms of each provider.


==================================================
54. UI/UX GENERATION WITH GOOGLE STITCH
==================================================

The UI/UX should be designed using Google Stitch when the Stitch MCP/tool is available.

The design should NOT be generated as unrelated individual screens.

Generate the entire product around the actual workflow.

Primary restaurant flow:

Landing
→ Signup
→ Onboarding
→ Upload Menu
→ AI Processing
→ Review Menu
→ Publish
→ QR Code


Primary customer flow:

Scan QR
→ Restaurant Menu
→ Search/Browse
→ Item
→ Cart
→ Checkout
→ Order Confirmation
→ Order Status


Restaurant order flow:

Dashboard
→ Orders
→ New Order
→ Telegram notification
→ Accept/Reject


The Stitch design should include:

- Responsive desktop layouts
- Mobile layouts
- Reusable components
- Design tokens
- Typography
- Buttons
- Inputs
- Cards
- Navigation
- Modals
- Toasts
- Loading states
- Empty states
- Error states
- Success states
- AI processing states


==================================================
55. STITCH DESIGN PRIORITIES
==================================================

Priority 1:

Customer mobile experience.


Priority 2:

Restaurant onboarding.


Priority 3:

AI menu review experience.


Priority 4:

Restaurant dashboard.


Priority 5:

Ordering experience.


Priority 6:

QR management.


The product should feel:

- Modern
- Trustworthy
- Fast
- Simple
- Professional
- Food-oriented


Avoid:

- excessive gradients
- excessive animations
- unnecessarily complex dashboards
- tiny text
- tiny touch targets
- confusing navigation
- over-engineered MVP UI


==================================================
56. COMPLETE DEMO SCENARIO
==================================================

The final MVP should support this complete demonstration:

1. Open SaaS.

2. Restaurant owner signs up.

3. Creates "Sharma Cafe".

4. Uploads two menu photos.

5. Gemini processes the photos.

6. Gemini extracts:

   6 categories
   24 items
   prices
   descriptions


7. Review screen appears.

8. Owner corrects AI mistakes.

9. Owner publishes menu.

10. System creates:

    /menu/sharma-cafe


11. System generates QR.

12. Restaurant downloads QR.

13. Customer scans QR.

14. Customer sees mobile menu.

15. Customer searches "Pizza".

16. Customer adds:

    Margherita × 2
    Cold Coffee × 1


17. Customer enters:

    Table 7


18. Customer places order.

19. Backend validates items and prices.

20. Order is stored in Supabase.

21. Telegram Bot sends:

    🔔 NEW ORDER #1048

    🏪 Sharma Cafe
    🪑 Table: 7

    🍕 Margherita × 2
    🥤 Cold Coffee × 1

    Total: ₹518


22. Restaurant receives notification.

23. Restaurant accepts order.

24. Backend updates:

    status = accepted


25. Customer sees:

    ✓ Order accepted

    Your order is being prepared.


==================================================
57. PROJECT DEVELOPMENT ORDER
==================================================

Build in this exact order:

1. Project setup
2. Authentication
3. Database
4. Multi-tenancy
5. Restaurant onboarding
6. Restaurant dashboard
7. Menu CRUD
8. Cloudinary
9. Gemini menu extraction
10. AI review UI
11. Menu publishing
12. Customer menu
13. Dynamic QR
14. Cart
15. Checkout
16. Orders
17. Telegram Bot
18. Telegram connection
19. Telegram order notification
20. Telegram accept/reject
21. Order status
22. Error handling
23. Security hardening
24. Responsive UI
25. Testing
26. Deployment


==================================================
58. TESTING REQUIREMENTS
==================================================

Test at minimum:

AUTH:

- Signup
- Login
- Logout
- Unauthorized dashboard access


MULTI-TENANCY:

- Restaurant A cannot access Restaurant B
- Restaurant A cannot modify Restaurant B
- Restaurant A cannot see Restaurant B orders


AI:

- Good quality menu
- Poor quality menu
- Multiple pages
- Missing price
- Duplicate item
- Strange formatting


MENU:

- Add
- Edit
- Delete
- Reorder
- Publish
- Unpublish


QR:

- Correct restaurant
- Invalid slug
- Unpublished restaurant
- Updated menu still accessible through same QR


ORDERS:

- Correct total
- Invalid item
- Unavailable item
- Quantity validation
- Price manipulation attempt
- Empty cart


TELEGRAM:

- Correct restaurant receives order
- Wrong restaurant does not receive order
- Telegram failure does not delete order
- Accept/reject updates correct order


==================================================
59. FUTURE FEATURES
==================================================

After MVP validation:

- Table-specific QR codes
- QR scan analytics
- Restaurant analytics
- Multiple branches
- Staff accounts
- Roles/permissions
- Payment integration
- UPI
- Online payment
- Offers
- Coupons
- Reviews
- Customer ordering history
- Restaurant discovery
- Nearby restaurants
- Dish search
- Veg/Jain filters
- Menu recommendations
- AI-generated descriptions
- Multi-language menus
- WhatsApp notifications
- Kitchen display system
- Subscription billing


==================================================
60. FINAL PRODUCT DEFINITION
==================================================

The MVP is:

AI Menu Digitization
+
Dynamic QR Menu
+
Online Ordering
+
Telegram Restaurant Notifications


The most important product loop is:

Restaurant
   ↓
Upload Existing Menu
   ↓
Gemini AI
   ↓
Structured Menu
   ↓
Human Review
   ↓
Publish
   ↓
Dynamic QR
   ↓
Customer Scans
   ↓
Browse
   ↓
Cart
   ↓
Order
   ↓
Supabase
   ↓
Telegram
   ↓
Restaurant


==================================================
61. FINAL PRODUCT PRINCIPLE
==================================================

Do not build a giant restaurant-management platform initially.

Build one extremely good workflow:

"Take the restaurant's existing menu and turn it into a live, editable QR ordering menu in minutes."

Everything else should support that workflow.

The MVP must prioritize:

Simplicity
Reliability
Speed
Security
AI accuracy
Good UX
Low infrastructure cost
Multi-tenant isolation


==================================================
62. SOURCE OF TRUTH
==================================================

The project's persistent context is stored in:

brain.md

brain.md should be treated as the project's long-term context/reference file.

Whenever the project is continued, use the existing product decisions and architecture in brain.md unless a newer explicit decision overrides them.


==================================================
END OF SOP
==================================================