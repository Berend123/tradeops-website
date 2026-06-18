import { NextResponse } from "next/server";

import { activateDiscordProAccess } from "../../../../lib/discord-entitlements";


export async function POST(request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload must be a JSON object.",
      },
      { status: 400 },
    );
  }

  try {
    const activation = await activateDiscordProAccess({
      email: payload.email,
      discordUserId: payload.discord_user_id,
    });
    return NextResponse.json(activation, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discord activation failed.";
    const status =
      /required|must be/i.test(message) ? 400 :
      /not found|join the server first/i.test(message) ? 404 :
      /no active tradeops subscription/i.test(message) ? 404 :
      500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status },
    );
  }
}
