/**
 * Validation & Data Integrity Module
 *
 * Responsible for:
 * - Input validation (dates, pay grades, leave balances, contribution limits)
 * - Impossible state detection
 * - Warning vs error taxonomy (errors block calculation; warnings inform user)
 *
 * Error: a condition that makes a calculation incorrect or legally impossible.
 * Warning: a condition that is unusual, potentially wrong, or requires acknowledgment.
 *
 * All validation rules cataloged in: docs/architecture.md
 */

export type { ValidationResult, ValidationError, ValidationWarning } from './errors';

export { validateCareerInput } from './errors';
export { warnOnAssumptions } from './warnings';
