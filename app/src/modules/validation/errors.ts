/**
 * Validation Errors
 *
 * Errors block calculation. They represent conditions that would produce
 * incorrect or legally impossible results.
 */

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Implementation to be completed in Phase 11.
export function validateCareerInput(_input: unknown): ValidationResult {
  throw new Error('Not implemented — Phase 11');
}
