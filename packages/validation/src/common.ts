export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: ValidationIssue[] };

export type Validator<T> = (value: unknown) => ValidationResult<T>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requiredString(
  value: unknown,
  path: string,
  maxLength = 1000
): ValidationResult<string> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { success: false, issues: [{ path, message: 'A non-empty string is required.' }] };
  }

  if (value.length > maxLength) {
    return { success: false, issues: [{ path, message: `Must be at most ${maxLength} characters.` }] };
  }

  return { success: true, data: value.trim() };
}
