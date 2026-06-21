const baseUrl = process.argv[2]?.replace(/\/$/, "") ?? "http://localhost:3000";
const url = `${baseUrl}/api/generation/readiness`;
const startedAt = Date.now();

const response = await fetch(url);
const body = await response.json().catch(() => ({}));
const elapsedMs = Date.now() - startedAt;

console.log(
  JSON.stringify(
    {
      url,
      httpStatus: response.status,
      elapsedMs,
      ...body,
    },
    null,
    2,
  ),
);

process.exit(response.ok && body.ok ? 0 : 1);
