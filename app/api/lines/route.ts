import { getTransportStatus } from "../../../lib/transport-status";

export async function GET() {
  const result = await getTransportStatus();
  return Response.json(result, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
  });
}
