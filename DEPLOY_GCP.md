# Deploy Crew to Google Cloud Platform

Hosting on **Cloud Run** + database on **Cloud SQL (Postgres)** + secrets in **Secret Manager** + the daily cron on **Cloud Scheduler**. Vercel keeps working until you flip DNS.

## Defaults assumed below

| | |
|---|---|
| Project ID | `crew-prod` |
| Region | `us-west1` |
| Cloud Run service | `crew` |
| Cloud SQL instance | `crew-db` |
| Postgres DB / user | `crew` / `crew` |
| URL (initial) | `https://crew-<hash>-uw.a.run.app` |

Adjust to taste; commands below assume these values.

## 1. Prereqs

```bash
brew install --cask google-cloud-sdk
gcloud auth login
gcloud projects create crew-prod --name="Crew"
gcloud config set project crew-prod
# Link billing in the console: https://console.cloud.google.com/billing
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  secretmanager.googleapis.com cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com artifactregistry.googleapis.com
```

## 2. Cloud SQL (Postgres 16)

```bash
gcloud sql instances create crew-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-west1 \
  --storage-size=10GB --storage-auto-increase

gcloud sql users create crew --instance=crew-db --password='<PICK_STRONG_PW>'
gcloud sql databases create crew --instance=crew-db
```

Get the instance connection name (you'll need it):

```bash
gcloud sql instances describe crew-db --format='value(connectionName)'
# → crew-prod:us-west1:crew-db
```

## 3. Run Prisma migrations (one-time, from your laptop)

Start the proxy in one terminal:

```bash
gcloud sql connect crew-db --user=crew  # quick connectivity sanity check
# or run the Cloud SQL Auth Proxy:
cloud-sql-proxy crew-prod:us-west1:crew-db &
```

Then in another terminal, with the proxy on `127.0.0.1:5432`:

```bash
DATABASE_URL='postgresql://crew:<PW>@127.0.0.1:5432/crew?schema=public' \
DIRECT_URL='postgresql://crew:<PW>@127.0.0.1:5432/crew?schema=public' \
npx prisma migrate deploy
```

## 4. Secret Manager

Create one secret per env var. Replace placeholders with real values.

```bash
# Database URL Cloud Run will use (Unix-socket form — Cloud Run mounts it for you)
INSTANCE='crew-prod:us-west1:crew-db'
DB_URL="postgresql://crew:<PW>@localhost/crew?host=/cloudsql/${INSTANCE}&schema=public"

for kv in \
  "DATABASE_URL=${DB_URL}" \
  "DIRECT_URL=${DB_URL}" \
  "NEXTAUTH_SECRET=<openssl rand -base64 32>" \
  "NEXTAUTH_URL=https://<your-cloud-run-url>" \
  "NEXT_PUBLIC_APP_URL=https://<your-cloud-run-url>" \
  "GOOGLE_CLIENT_ID=<from Google Cloud Console>" \
  "GOOGLE_CLIENT_SECRET=<from Google Cloud Console>" \
  "ALLOWED_EMAILS=*@aspadeco.com" \
  "RECRUITING_EMAILS=abby@aspadeco.com" \
  "CRON_SECRET=$(openssl rand -hex 32)" \
  "SLACK_OFFER_WEBHOOK_URL=<...>" \
  "SLACK_RECRUITING_WEBHOOK_URL=<...>" \
  "SLACK_TICKET_DEEL_WEBHOOK_URL=<...>" \
  "SLACK_TICKET_OFFICE_WEBHOOK_URL=<...>" \
  "SLACK_TICKET_SAFETY_WEBHOOK_URL=<...>" \
  "SLACK_TICKET_TRUCK_WEBHOOK_URL=<...>" \
  "SLACK_TICKET_IT_WEBHOOK_URL=<...>" \
  "SLACK_TICKET_ONE_WEEK_WEBHOOK_URL=<...>"
do
  name="${kv%%=*}"; value="${kv#*=}"
  printf '%s' "$value" | gcloud secrets create "$name" --data-file=- 2>/dev/null \
    || printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=-
done
```

**Note on the DB URL:** Cloud Run mounts the Cloud SQL socket at `/cloudsql/<INSTANCE>`. The pgbouncer query params we use on Supabase are **not** needed here — drop them.

## 5. Deploy Cloud Run

First deploy (builds the Dockerfile in this repo):

```bash
SECRETS=$(printf '%s,' \
  DATABASE_URL=DATABASE_URL:latest \
  DIRECT_URL=DIRECT_URL:latest \
  NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest \
  NEXTAUTH_URL=NEXTAUTH_URL:latest \
  NEXT_PUBLIC_APP_URL=NEXT_PUBLIC_APP_URL:latest \
  GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest \
  GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest \
  ALLOWED_EMAILS=ALLOWED_EMAILS:latest \
  RECRUITING_EMAILS=RECRUITING_EMAILS:latest \
  CRON_SECRET=CRON_SECRET:latest \
  SLACK_OFFER_WEBHOOK_URL=SLACK_OFFER_WEBHOOK_URL:latest \
  SLACK_RECRUITING_WEBHOOK_URL=SLACK_RECRUITING_WEBHOOK_URL:latest \
  SLACK_TICKET_DEEL_WEBHOOK_URL=SLACK_TICKET_DEEL_WEBHOOK_URL:latest \
  SLACK_TICKET_OFFICE_WEBHOOK_URL=SLACK_TICKET_OFFICE_WEBHOOK_URL:latest \
  SLACK_TICKET_SAFETY_WEBHOOK_URL=SLACK_TICKET_SAFETY_WEBHOOK_URL:latest \
  SLACK_TICKET_TRUCK_WEBHOOK_URL=SLACK_TICKET_TRUCK_WEBHOOK_URL:latest \
  SLACK_TICKET_IT_WEBHOOK_URL=SLACK_TICKET_IT_WEBHOOK_URL:latest \
  SLACK_TICKET_ONE_WEEK_WEBHOOK_URL=SLACK_TICKET_ONE_WEEK_WEBHOOK_URL:latest \
)
SECRETS="${SECRETS%,}"

gcloud run deploy crew \
  --source . \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances crew-prod:us-west1:crew-db \
  --set-secrets "$SECRETS" \
  --cpu 1 --memory 512Mi --min-instances 0 --max-instances 4
```

After the first deploy, grab the URL and update `NEXTAUTH_URL` + `NEXT_PUBLIC_APP_URL` secrets, then redeploy.



## 6. Update Google OAuth

Google Cloud Console → APIs & Services → Credentials → your OAuth client → **Authorized redirect URIs**, add:

```
https://<your-cloud-run-url>/api/auth/callback/google
```

Keep the Vercel one in place until cutover.

## 7. Cloud Scheduler (replaces vercel.json cron)

```bash
gcloud iam service-accounts create crew-cron --display-name="Crew Cron Invoker"
SA="crew-cron@crew-prod.iam.gserviceaccount.com"
gcloud run services add-iam-policy-binding crew \
  --region=us-west1 --member="serviceAccount:${SA}" \
  --role=roles/run.invoker

CRON_SECRET=$(gcloud secrets versions access latest --secret=CRON_SECRET)
URL="$(gcloud run services describe crew --region=us-west1 --format='value(status.url)')/api/cron/onboarding-tickets"

gcloud scheduler jobs create http crew-onboarding-tickets \
  --location=us-west1 \
  --schedule="0 15 * * *" \
  --time-zone="Etc/UTC" \
  --uri="$URL" \
  --http-method=GET \
  --headers="Authorization=Bearer ${CRON_SECRET}" \
  --oidc-service-account-email="$SA"
```

Matches the existing `vercel.json` schedule (15:00 UTC daily).

## 8. Cutover

1. Sanity-check the Cloud Run URL end-to-end (sign in, `/team`, `/onboarding`, `/recruiting`).
2. (Optional) Map a custom domain:
   `gcloud beta run domain-mappings create --service=crew --domain=crew.aspadeco.com --region=us-west1`
   Then add the CNAME / A records it prints to your DNS.
3. Update Google OAuth redirect URIs to use the custom domain.
4. Update `NEXTAUTH_URL` + `NEXT_PUBLIC_APP_URL` secrets → redeploy.
5. Pause the Vercel cron (delete `vercel.json` from main, or disable in dashboard) so tickets aren't created twice.
6. Delete the Vercel project once you've watched Cloud Run for a few days.

## 9. Day-2

- **Logs:** `gcloud run services logs read crew --region=us-west1 --limit 100`
- **New migrations:** run `prisma migrate deploy` against the Cloud SQL proxy from your laptop, then redeploy Cloud Run.
- **Roll back:** `gcloud run services update-traffic crew --to-revisions=<prev>=100 --region=us-west1`
- **Cost (rough, at idle):** Cloud SQL `db-f1-micro` ~$10/mo + Cloud Run scales to zero (~$0) + Secret Manager (~$0).
