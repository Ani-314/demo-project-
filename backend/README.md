# LearnMate AI — Real Kids / Parents / Teacher System

This is a full-stack PostgreSQL version. It does NOT use LocalStorage as the source of learning reports.

## Implemented
- Kid Student ID + PIN login
- Parent email/password login
- Teacher email/password login
- Kid login/logout sessions stored in DB
- Parent + Teacher real-time in-app notification on kid login/logout
- Quiz completion notifications
- Total study time + activity log
- Board + Standard + selected subjects
- Teacher sets today's Board + Standard + Subject + Topic
- Student daily quiz follows teacher topic when question bank has matching questions
- Quiz result saved permanently
- Parent and Teacher get subject-wise averages and weak-subject recommendations
- Secure server-side OpenAI Tutor integration

## Setup
1. Install Node.js 18+ and PostgreSQL (or use Supabase/Neon PostgreSQL).
2. `npm install`
3. Copy `.env.example` to `.env` and set DATABASE_URL + JWT_SECRET.
4. Add OPENAI_API_KEY for real AI Tutor.
5. `npm run init-db`
6. `npm start`
7. Open http://localhost:3000

## Demo credentials
Parent: parent@demo.com / demo123
Teacher: teacher@demo.com / demo123
Kid: LM-AARAV-1001 / PIN 1234

## Notification behavior
Events are stored in the notifications table. If Parent/Teacher dashboard is open, Socket.IO shows the notification instantly. If they are offline, the notification remains in the DB and appears on the dashboard later. Phone push/SMS/WhatsApp requires an additional notification provider.

## Production next steps
For a public school deployment add email verification/password reset, parent consent, stronger session revocation, teacher/school approval, class/section mapping, admin curriculum editor, rate limits, audit logs and child privacy controls.


---

# PHONE / DESKTOP PUSH NOTIFICATIONS — CONNECTED

This upgraded package includes real Web Push notifications.

Parent or Teacher:
1. Logs in.
2. Presses **Enable Phone Notifications**.
3. Browser asks permission.
4. Subscription is stored in PostgreSQL.
5. Kid login, kid logout, and quiz completion events send a push notification.

Notifications can appear even when the LearnMate tab is not open, as long as:
- the browser supports Web Push,
- notification permission is allowed,
- the deployed site uses HTTPS (localhost is also allowed),
- the browser/OS has not disabled notifications.

## One-time VAPID setup

After `npm install`, run:

`npm run generate-vapid`

Copy the three displayed values into `.env`:

- `VAPID_PUBLIC_KEY=...`
- `VAPID_PRIVATE_KEY=...`
- `VAPID_SUBJECT=mailto:your-email@example.com`

Then restart the server.

## Events that currently trigger push

- Kid logged in
- Kid logged out, including study-session duration
- Kid completed a quiz, including score

The same events are also permanently stored in the in-app notification history.

## Important mobile note

For best reliability on Android, open the deployed HTTPS site in Chrome and allow notifications.
On iPhone/iPad, web push requires a supported iOS version and the web app may need to be added to the Home Screen depending on Safari behavior/version.

## WhatsApp / SMS

This ZIP uses free browser push and does not require a paid messaging provider.
Direct WhatsApp or SMS needs a separate provider/account and credentials (for example WhatsApp Business Platform or an SMS gateway).
