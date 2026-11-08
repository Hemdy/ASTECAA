import { ApiError } from "../core/errors.ts";
import { isRecord, type Validator } from "@astec/validation";

const MAX_JSON_BODY_BYTES = 1024 * 1024;

export async function parseJson<T>(
  request: Request,
  validator: Validator<T>,
): Promise<T> {
  const contentLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
    throw new ApiError(413, "Request body is too large.", "BODY_TOO_LARGE");
  }

  if (!request.body) {
    throw new ApiError(400, "Request body must be valid JSON.", "INVALID_JSON");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    totalBytes += value.byteLength;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      await reader.cancel();
      throw new ApiError(413, "Request body is too large.", "BODY_TOO_LARGE");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.", "INVALID_JSON");
  }

  if (!isRecord(value)) {
    throw new ApiError(
      400,
      "Request body must be a JSON object.",
      "INVALID_BODY",
    );
  }

  const result = validator(value);
  if (!result.success) {
    throw new ApiError(422, "Request validation failed.", "VALIDATION_ERROR");
  }

  return result.data;
}
