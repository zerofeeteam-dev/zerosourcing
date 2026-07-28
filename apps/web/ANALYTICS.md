# Product analytics

The web app uses PostHog for anonymous product analytics and session replay.
Tracking remains disabled until `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set.

## Configure

1. Create a PostHog project.
2. Copy its project token and ingestion host into the web app environment:

   ```dotenv
   NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   ```

3. Add the same variables to the production deployment and redeploy.
4. Open PostHog's live events while navigating the deployed site.

The integration automatically collects page views, page leaves, clicks, dead
clicks, heatmaps, and session replays. All form inputs are masked. Network
headers, request bodies, URL query strings, and URL fragments are not recorded.

## Custom events

| Event                    | Meaning                                   | Properties                  |
| ------------------------ | ----------------------------------------- | --------------------------- |
| `cta_clicked`            | A shared CTA was selected                 | `cta_action`, `destination` |
| `contact_form_started`   | The contact form received its first focus | `form_name`                 |
| `contact_form_submitted` | The contact API accepted the submission   | `form_name`                 |

No contact form values are sent to PostHog.

## Suggested funnel

Create a funnel insight with these steps:

1. `$pageview`
2. `cta_clicked` with `cta_action = outsource`
3. `$pageview` with path `/contact`
4. `contact_form_started`
5. `contact_form_submitted`

Use a path insight ending at `$pageleave` to find common exit pages, then filter
session replays by the failed funnel step to inspect why users stopped.

## Before production enablement

Update the privacy policy and overseas-processing disclosures for the exact
PostHog Cloud region and retention settings selected for the project. Confirm
the desired consent behavior with the service's privacy owner before adding the
production project token.

- Next.js setup: https://posthog.com/docs/libraries/next-js
- Session replay privacy: https://posthog.com/docs/session-replay/privacy
