export function initialReleaseState(now, published) {
  const opens = Date.parse("2026-10-26T20:50:12.845Z");
  const closes = Date.parse("2026-10-27T20:00:00Z");
  if (published) return "published";
  if (now < opens) return "waiting";
  if (now >= closes) return "expired";
  return "ready";
}
