// Resumable streams are currently disabled
// This endpoint is kept for API compatibility but returns 204 No Content

export function GET(_: Request) {
  // Return 204 No Content when resumable streams are disabled
  return new Response(null, { status: 204 });
}
