import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

test("join route file exists with the primary Discord CTA", () => {
  const routePath = path.join(process.cwd(), "app", "join", "page.js");
  assert.equal(existsSync(routePath), true);

  const source = readFileSync(routePath, "utf8");
  assert.match(source, /Connect Discord/);
  assert.match(source, /DiscordActivationForm/);
  assert.match(source, /pageType="join"/);
});
