import test from "node:test";
import assert from "node:assert/strict";

import { normalizeDiscordUserId } from "../lib/discord-entitlements.js";


test("normalizeDiscordUserId extracts a Discord snowflake from raw input", () => {
  assert.equal(normalizeDiscordUserId("1515448552623702106"), "1515448552623702106");
  assert.equal(normalizeDiscordUserId("<@1515448552623702106>"), "1515448552623702106");
  assert.equal(
    normalizeDiscordUserId("https://discord.com/users/1515448552623702106"),
    "1515448552623702106",
  );
  assert.equal(normalizeDiscordUserId("not-a-user"), "");
});
