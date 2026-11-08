import assert from "node:assert/strict";
import { parseJson } from "./parse-json.ts";
import { ApiError } from "../core/errors.ts";

const objectValidator = (value: unknown) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? { success: true as const, data: { accepted: true } }
    : { success: false as const, issues: [] };

Deno.test("parseJson validates a bounded JSON object", async () => {
  const result = await parseJson(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: "ok" }),
    }),
    objectValidator,
  );
  assert.deepEqual(result, { accepted: true });
});

Deno.test("parseJson rejects request bodies larger than the configured maximum", async () => {
  const request = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(1024 * 1024) }),
  });

  await assert.rejects(
    () => parseJson(request, objectValidator),
    (error: unknown) =>
      error instanceof ApiError &&
      error.status === 413 &&
      error.code === "BODY_TOO_LARGE",
  );
});

Deno.test("parseJson rejects malformed JSON", async () => {
  await assert.rejects(
    () =>
      parseJson(
        new Request("http://localhost", { method: "POST", body: "{invalid" }),
        objectValidator,
      ),
    (error: unknown) =>
      error instanceof ApiError && error.status === 400 &&
      error.code === "INVALID_JSON",
  );
});
