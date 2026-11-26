# evalkeen client dashboard

Owner/staff dashboard for the WhatsApp lead-qualifier bot. Next.js 15 (App Router) + Supabase.

## How it fits together

```
WhatsApp → n8n bot ──(after reply)──► Supabase public.ingest_lead()  ──► leads, lead_events
                                                                          ▲
                              this dashboard (Supabase Auth, RLS) ────────┘
```

- **n8n** owns the conversation and scoring. It writes every lead and event through one function, `public.ingest_lead(jsonb)`, using the service-role key. That key never goes in this app.
- **This app** reads with the logged-in user's session. Row-level security limits every query to the user's own client. The only thing a user can change is a lead's `status`, `lost_reason` and `assigned_to`; every status change is logged to `lead_events` by a database trigger.
- **Numbers** come from `public.dashboard_summary()` and `public.service_detail()`. They count `qualified` events, not the lead's current score, so a lead who restarts the bot doesn't erase an earlier hot result.

## Screens

| Route | What it shows |
|---|---|
| `/login` | Email + password |
| `/` | KPIs (7 / 30 days vs previous period), hot & warm leads not contacted, enquiries by service |
| `/services/[id]` | Per-service: totals, countries asked for, answer breakdowns, recent leads |
| `/leads` | All leads, filter by score, search by name or phone |
| `/leads/[id]` | Answers, score reason, timeline, WhatsApp conversation, status buttons |

Status buttons are hidden behind "managed in your CRM" when `clients.status_owner = 'crm'`.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Deploy (Vercel)

1. Import this repo in Vercel (framework: Next.js).
2. Add the two env vars from `.env.example` (both are public, browser-safe values).
3. In Supabase → Authentication → URL Configuration, set **Site URL** to the Vercel URL.

## Adding a user (until there is an admin screen)

1. Supabase → Authentication → Users → **Add user** → email + password, tick "Auto confirm".
2. Link the user to a client (SQL editor):

```sql
insert into public.profiles (id, client_id, full_name, role)
values ('<auth user id>', (select id from public.clients where slug = 'artic-immigrations'), 'Owner Name', 'owner');
-- role: 'owner' | 'staff' | 'agency_admin' (agency_admin: client_id null, sees all clients)
```

Keep public sign-ups **disabled** (Authentication → Sign In / Providers → Email → "Allow new users to sign up" off).

## Adding a client

```sql
insert into public.clients (name, slug) values ('Client Name', 'client-slug') returning id;
insert into public.services (client_id, name, slug, sort_order) values (...);       -- names must match the bot's purpose options exactly
insert into public.service_questions (service_id, key, label, sort_order) values (...); -- display labels for answer keys
```

Then put the client id in that client's n8n settings table as `supabase_client_id`.
