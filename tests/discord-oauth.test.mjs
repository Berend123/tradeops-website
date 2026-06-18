import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDiscordOAuthAuthorizeUrl,
  buildDiscordOAuthRedirectTarget,
  buildDiscordOAuthStartState,
  parseDiscordSession,
  resolveDiscordOAuthReturnTo,
  serializeDiscordSession,
} from "../lib/discord-oauth.js";


test("resolveDiscordOAuthReturnTo preserves attribution query params on the return path", () => {
  const returnTo = resolveDiscordOAuthReturnTo(
    "https://tradeops.org/api/discord/oauth/start?return_to=%2Fpricing&atid=abc123&src=x&campaign=reply_queue",
  );

  assert.equal(returnTo, "/pricing?atid=abc123&src=x&campaign=reply_queue");
});


test("buildDiscordOAuthAuthorizeUrl includes the expected implicit grant parameters", () => {
  const url = buildDiscordOAuthAuthorizeUrl({
    clientId: "1515448552623702106",
    redirectUri: "https://tradeops.org/discord/oauth/complete",
    state: "nonce_123",
  });

  assert.match(url, /response_type=token/);
  assert.match(url, /client_id=1515448552623702106/);
  assert.match(url, /scope=identify\+email\+guilds.join|scope=identify%20email%20guilds.join/);
  assert.match(url, /state=nonce_123/);
});


test("discord session serialization round-trips the connected user", () => {
  const serialized = serializeDiscordSession({
    userId: "1515448552623702106",
    username: "TradeOps Connector",
    globalName: "TradeOps",
    email: "alpha@example.com",
    avatarUrl: "https://cdn.discordapp.com/example.png",
    connectedAt: "2026-06-18T10:00:00.000Z",
  });
  const parsed = parseDiscordSession(serialized);

  assert.equal(parsed.userId, "1515448552623702106");
  assert.equal(parsed.username, "TradeOps Connector");
  assert.equal(parsed.globalName, "TradeOps");
  assert.equal(parsed.email, "alpha@example.com");
  assert.equal(parsed.avatarUrl, "https://cdn.discordapp.com/example.png");
});


test("buildDiscordOAuthRedirectTarget adds status parameters to the original path", () => {
  const target = buildDiscordOAuthRedirectTarget("/join?atid=abc123", {
    discord: "connected",
  });

  assert.equal(target, "/join?atid=abc123&discord=connected");
});


test("buildDiscordOAuthStartState creates a nonce and preserves the return path", () => {
  const state = buildDiscordOAuthStartState({
    returnTo: "/join?atid=abc123",
  });

  assert.equal(state.returnTo, "/join?atid=abc123");
  assert.ok(state.nonce.length > 10);
});
