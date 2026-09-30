import {
  ensureMemberSchema,
  getMemberDatabase,
  isMemberDatabaseConfigured,
} from "./member-db.js";
import { normalizeAttributionEventPayload } from "./attribution-payload.mjs";


export function isAttributionDatabaseConfigured(env = process.env) {
  return isMemberDatabaseConfigured(env);
}


export async function storeAttributionEvent(payload, env = process.env) {
  const normalized = normalizeAttributionEventPayload(payload);
  if (!normalized.ok) {
    const error = new Error(normalized.error);
    error.status = 400;
    throw error;
  }
  if (!isAttributionDatabaseConfigured(env)) {
    const error = new Error("DATABASE_URL is not configured.");
    error.status = 503;
    throw error;
  }

  await ensureMemberSchema(env);
  const event = normalized.payload;
  const db = getMemberDatabase(env);
  const rows = await db.query(
    `
      INSERT INTO attribution_events (
        event_id, event_type, atid, first_touch_atid, last_touch_atid, anonymous_id,
        source, campaign, page, referrer, event_timestamp, affiliate_code, payload_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `,
    [
      event.event_id,
      event.event_type,
      event.atid,
      event.first_touch_atid,
      event.last_touch_atid,
      event.anonymous_id,
      event.source,
      event.campaign,
      event.page,
      event.referrer,
      event.timestamp || null,
      event.affiliate_code,
      JSON.stringify(event),
    ],
  );
  if (!Array.isArray(rows)) {
    throw new Error("Attribution database returned an invalid result.");
  }
  return { eventId: event.event_id, duplicate: rows.length === 0 };
}
