import { proxyConversionRequest } from "../../../../lib/conversion-api";


export async function POST(request) {
  const payload = await request.json().catch(() => null);
  return proxyConversionRequest({
    path: "/api/discord/join",
    payload,
  });
}
