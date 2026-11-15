# Student subscription

## Mobile navigation
- [x] Move the mobile page title beside the union logo, replacing the brand label only on mobile.
- [x] Float the five existing navigation buttons above the screen edge with active states and safe-area spacing.
- [x] Verify authenticated events and scholarships, course navigation and active state, 320px/390px phones, and unchanged desktop navigation.

## Student market examples
- [x] Replace existing products with exactly three detailed, clearly labelled student resale examples, preserving previous orders.
- [x] Upload book, laptop, and study-supply illustrations through the existing private image flow.
- [x] Verify all three approved products, loaded pictures, and detail navigation on desktop and mobile using the owner's authenticated account.

## Product details
- [x] Add approved product detail pages and market image/title links, preserving cart controls.
- [x] Display published seller contacts as phone/email links; never expose private profiles or fabricate missing contacts.
- [ ] Verify actual product navigation and contact links (blocked: the available injected account redirects to onboarding; a completed signed-in profile is required). Contact parsing tests and compilation pass.

## News image frame sweep
- [x] Audit home slider, news list, detail carousel, expanded viewer, admin upload previews, and image upload/signing paths.
- [x] Fill news list covers as well as home/detail frames without changing other galleries or stored images.
- [x] Check current compilation; authenticated visual checks remain unavailable because the injected account redirects to onboarding.

## Profile presentation
- [x] Redesign profile summary, activity shortcuts, grouped student fields, and photo editing without changing access or subscription rules.
- [x] Verify existing real data saves and reads back, photo dialog opens, and desktop/mobile summary and university fields render correctly.

## Assistant answer presentation
- [x] Render formatted answers with safe links, readable lists, and clickable phone/email contacts.
- [x] Verify an actual assistant response, bold/list formatting, callable phone/email links, and phone layout; three safety tests pass.

## Deal filtering
- [x] Add compact search and combined city/company filters, preserving the student-city default.
- [x] Verify combined filters, reset, and mobile display with real offers and five passing filtering tests.

## Partner profiles
- [x] Open partner information and all available offers from deal cards, keeping the redemption popup separate.
- [x] Verify card navigation and redemption from both pages on actual offers, including phone layout.

## University directory
- [x] Add domestic university catalogue with compact search, city filtering, and existing university-logo lookup.
- [x] Research institutional contact emails with source links and clearly label demo representatives.

## Course browsing and quizzes
- [x] Add category/search/enrollment/sort filters and clickable course cards.
- [x] Move enrollment to details and show introduction and embedded lesson videos.
- [x] Add staff-managed multiple-choice quizzes with saved, server-graded attempts.
- [x] Test course browsing, enrollment, video selection, and quiz results.

## Scholarships and content photos
- [x] Add scholarships to home services and dashboard management.
- [x] Upload and display news, event, and product photos in lists and details.
- [x] Verify administrator upload/edit/removal and photos on service pages, phone, and tablet.

## Real subscription (previous work; blocked by merchant credentials)

- [x] Add an isolated iyzico demo page with 100 TRY monthly plan, success/failure simulation, and a profile link; no real charge or membership activation.

- [x] Confirm seller country: Turkey; eligibility check recommends Paddle with manual review, approval not guaranteed.
- [ ] Connect real iyzico payments (blocked: merchant test credentials required; current demo is not connected).
- [ ] Create the 100 TRY monthly subscription product after enabling payments.
- [ ] Implement payment, verified subscription activation, and paid access to student services; preserve access to account and billing.
- [ ] Test checkout, subscription renewal/expiry, and access restrictions.