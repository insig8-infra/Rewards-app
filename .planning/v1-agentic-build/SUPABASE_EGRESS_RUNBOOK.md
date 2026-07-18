# Supabase Egress Runbook - Volt Rewards V1

Created: 2026-07-16  
Trigger: Supabase Free plan egress screenshot and Phase 27 Storage `402 exceed_egress_quota` blocker

## Current Finding

The Supabase dashboard screenshot from 2026-07-16 shows:

- Included Free plan egress: 5 GB.
- Used in period: 16.70 GB.
- Overage in period: 11.70 GB.
- Main spike: July 7 and July 8.

This is not a database-size issue. Supabase egress is outgoing traffic from the project and can include Database/API, Storage, Realtime, Auth, Edge Functions, Pooler/Supavisor, and Log Drains. Phase 27 specifically hit Supabase Storage restriction while trying to upload a reward image for a fresh proof reward.

## Development Policy

Development must not rely on remote Supabase Storage unless a phase explicitly needs to verify the production storage path.

Default development mode:

```env
MEDIA_STORAGE_MODE=local
```

In local media mode:

- Reward and promotion uploads validate file type/size through the same backend code path.
- Uploads return one shared local placeholder image as a data URL.
- Existing Supabase Storage public URLs are replaced in API read models with the same placeholder, so mobile/web clients do not keep downloading old Storage assets.
- The PostgreSQL database can still be remote Supabase if needed; this setting only controls media storage behavior.

This keeps development manageable while preserving product behavior: rewards still require images before activation, UI still renders image-backed cards, and OWNER/STaff role rules are unchanged.

## Diagnosing Egress

Use Supabase Dashboard first:

1. Billing usage: confirm whether the overage is uncached egress, cached egress, or both.
2. Project reports: check Database API egress and high-row queries.
3. Logs Explorer top paths: identify repeated API or Storage paths.
4. Storage Egress Requests template: find repeatedly downloaded objects.

Useful Storage Logs Explorer query from Supabase docs:

```sql
select
  request.method as http_verb,
  request.path as filepath,
  (responseHeaders.cf_cache_status = 'HIT') as cached,
  count(*) as num_requests
from
  edge_logs
  cross join unnest(metadata) as metadata
  cross join unnest(metadata.request) as request
  cross join unnest(metadata.response) as response
  cross join unnest(response.headers) as responseHeaders
where
  (path like '%storage/v1/object/%' or path like '%storage/v1/render/%')
  and request.method = 'GET'
group by 1, 2, 3
order by num_requests desc
limit 100;
```

## Production Policy

Production and staging must use explicit remote media storage:

```env
MEDIA_STORAGE_MODE=supabase
SUPABASE_PROJECT_ID=<project-ref>
SUPABASE_SECRET_KEY=<server-side-service-key>
SUPABASE_REWARD_IMAGES_BUCKET=reward-images
SUPABASE_PROMOTION_IMAGES_BUCKET=promotion-assets
```

Before production launch:

1. Use a paid Supabase plan sized for production traffic.
2. Decide spend-cap behavior. If spend cap is on, service can be restricted after quota. If off, overage is billed.
3. Create separate dev, staging, and production projects.
4. Verify buckets, public/private policy, upload, readback, and cache behavior.
5. Keep service keys backend-only.
6. Compress images and keep reward/promotion media under the app's 2 MB validation limit.
7. Monitor Storage/API/Pooler egress during UAT and after launch.
8. Add backup/restore and migration runbooks before production data is considered durable.

## Eval Gate

Development proof can pass with `MEDIA_STORAGE_MODE=local` if:

- Upload validation still runs.
- Reward activation still requires at least one image.
- Mobile/Admin Web read models render image-backed cards without requesting Supabase Storage URLs.
- The phase status clearly states that production Supabase Storage upload/readback remains a launch gate.

Production readiness can pass only when:

- `MEDIA_STORAGE_MODE=supabase` is tested against staging/production.
- Buckets and permissions are verified.
- Upload/readback succeeds without quota restriction.
- Egress usage is monitored and within the accepted operating budget.
